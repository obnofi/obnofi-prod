"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SharedTimerState } from "@/lib/realtimeSync";

function formatTime(remainingMs: number) {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function playTimerChime() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextCtor = window.AudioContext ?? (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.25);
  void context.close().catch(() => undefined);
}

export function TimerWidget({
  remainingMs,
  timer,
  onDurationChange,
  onPause,
  onReset,
  onStart,
}: {
  remainingMs: number;
  timer: SharedTimerState;
  onDurationChange: (durationMinutes: number) => void;
  onPause: () => void;
  onReset: () => void;
  onStart: () => void;
}) {
  const [draftMinutes, setDraftMinutes] = useState(String(Math.round(timer.durationMs / 60_000)));
  const [isFlashing, setIsFlashing] = useState(false);
  const previousRemainingRef = useRef(remainingMs);

  useEffect(() => {
    setDraftMinutes(String(Math.round(timer.durationMs / 60_000)));
  }, [timer.durationMs]);

  useEffect(() => {
    if (previousRemainingRef.current > 0 && remainingMs === 0) {
      setIsFlashing(true);
      playTimerChime();
      const timeout = window.setTimeout(() => setIsFlashing(false), 900);
      return () => window.clearTimeout(timeout);
    }

    previousRemainingRef.current = remainingMs;
    return undefined;
  }, [remainingMs]);

  useEffect(() => {
    previousRemainingRef.current = remainingMs;
  }, [remainingMs]);

  const durationLabel = useMemo(
    () => `${Math.round(timer.durationMs / 60_000)} min`,
    [timer.durationMs]
  );

  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm backdrop-blur transition ${
        isFlashing
          ? "border-amber-400 bg-amber-100/95 ring-4 ring-amber-300/70"
          : "border-[var(--color-border)] bg-[var(--color-surface)]/90"
      }`}
    >
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
            Shared Timer
          </p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
            {formatTime(remainingMs)}
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span>Duration</span>
          <input
            className="w-16 rounded-xl border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm text-[var(--color-text-primary)] outline-none"
            max={180}
            min={1}
            step={1}
            type="number"
            value={draftMinutes}
            onChange={(event) => setDraftMinutes(event.target.value)}
            onBlur={() => {
              const nextMinutes = Number(draftMinutes);
              if (Number.isFinite(nextMinutes) && nextMinutes > 0) {
                onDurationChange(nextMinutes);
              } else {
                setDraftMinutes(String(Math.round(timer.durationMs / 60_000)));
              }
            }}
          />
          <span>{durationLabel}</span>
        </label>

        <div className="flex items-center gap-2">
          {timer.isRunning ? (
            <button
              className="rounded-xl bg-[var(--color-text-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-background)]"
              onClick={onPause}
              type="button"
            >
              Pause
            </button>
          ) : (
            <button
              className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white"
              onClick={onStart}
              type="button"
            >
              Start
            </button>
          )}
          <button
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)]"
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
