"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LaserPointerState } from "@/types/collaboration";

// Firefly — 레이저 포인터.
// 활성 방법 2가지:
//   1) 'r' 키를 누른 채 커서를 막 흔든다 (shake 감지) → 활성
//   2) 툴바에서 laser 툴 선택 → 커서를 움직이면 바로 활성
// 활성 후 마지막 움직임으로부터 5초 뒤 페이드아웃되며 사라진다.

const LASER_TTL_MS = 5000;       // 마지막 움직임 후 유지 시간
const LASER_FADE_MS = 320;       // 페이드아웃 길이
const TRAIL_MS = 420;            // trail(잔상) 점 수명
const BROADCAST_INTERVAL_MS = 45;
const SHAKE_WINDOW_MS = 550;     // shake 판정 시간창
const SHAKE_MIN_REVERSALS = 4;   // 방향 전환 최소 횟수
const SHAKE_MIN_DELTA = 3;       // 움직임으로 칠 최소 |dx| (scene 단위)

type TrailPoint = { x: number; y: number; t: number };

export type LocalLaser = {
  points: { x: number; y: number }[];
  color: string;
  fadingOut: boolean;
} | null;

export function useLaserPointer({
  color,
  toolActive,
  updateLaser,
}: {
  color: string;
  toolActive: boolean; // tool === "laser"
  updateLaser: (state: LaserPointerState | null) => void;
}) {
  const [localLaser, setLocalLaser] = useState<LocalLaser>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const activeRef = useRef(false);
  const rHeldRef = useRef(false);
  const lastBroadcastRef = useRef(0);
  const fadeTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  const toolActiveRef = useRef(toolActive);
  toolActiveRef.current = toolActive;
  const colorRef = useRef(color);
  colorRef.current = color;

  const clearTimers = useCallback(() => {
    if (fadeTimerRef.current != null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const stopLaser = useCallback(() => {
    clearTimers();
    activeRef.current = false;
    trailRef.current = [];
    lastBroadcastRef.current = 0;
    setLocalLaser(null);
    updateLaser(null);
  }, [clearTimers, updateLaser]);

  const scheduleExpiry = useCallback(() => {
    clearTimers();
    fadeTimerRef.current = window.setTimeout(() => {
      setLocalLaser((prev) => (prev ? { ...prev, fadingOut: true } : prev));
      clearTimerRef.current = window.setTimeout(stopLaser, LASER_FADE_MS);
    }, LASER_TTL_MS);
  }, [clearTimers, stopLaser]);

  // 최근 trail에서 좌우 방향 전환 횟수로 shake 판정
  const detectShake = useCallback(() => {
    const now = Date.now();
    const recent = trailRef.current.filter((p) => now - p.t <= SHAKE_WINDOW_MS);
    if (recent.length < 4) return false;
    let reversals = 0;
    let prevDir = 0;
    for (let i = 1; i < recent.length; i += 1) {
      const dx = recent[i].x - recent[i - 1].x;
      if (Math.abs(dx) < SHAKE_MIN_DELTA) continue;
      const dir = dx > 0 ? 1 : -1;
      if (prevDir !== 0 && dir !== prevDir) reversals += 1;
      prevDir = dir;
    }
    return reversals >= SHAKE_MIN_REVERSALS;
  }, []);

  const onScenePoint = useCallback(
    (point: { x: number; y: number }) => {
      const now = Date.now();
      trailRef.current.push({ x: point.x, y: point.y, t: now });
      trailRef.current = trailRef.current.filter((p) => now - p.t <= TRAIL_MS);

      const armed = toolActiveRef.current || rHeldRef.current;
      if (!armed) return;

      if (!activeRef.current) {
        // 툴 모드는 움직임만으로 발동, 'r' 모드는 shake 필요
        const triggered = toolActiveRef.current ? true : detectShake();
        if (!triggered) return;
        activeRef.current = true;
      }

      const points = trailRef.current.map((p) => ({ x: p.x, y: p.y }));
      setLocalLaser({ points, color: colorRef.current, fadingOut: false });
      scheduleExpiry();

      if (now - lastBroadcastRef.current >= BROADCAST_INTERVAL_MS) {
        lastBroadcastRef.current = now;
        updateLaser({
          points,
          color: colorRef.current,
          expiresAt: now + LASER_TTL_MS,
          updatedAt: now,
        });
      }
    },
    [detectShake, scheduleExpiry, updateLaser]
  );

  // 'r' 키 hold 추적 (입력/편집 영역에서는 무시)
  useEffect(() => {
    const isEditingTarget = () => {
      const el = document.activeElement as HTMLElement | null;
      return Boolean(el?.closest("input, textarea, [contenteditable='true']"));
    };
    const down = (event: KeyboardEvent) => {
      if (event.key !== "r" && event.key !== "R") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditingTarget()) return;
      rHeldRef.current = true;
    };
    const up = (event: KeyboardEvent) => {
      if (event.key !== "r" && event.key !== "R") return;
      rHeldRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => stopLaser, [stopLaser]);

  return { localLaser, onScenePoint };
}
