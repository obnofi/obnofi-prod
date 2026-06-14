"use client";

import { useEffect, useMemo } from "react";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useLaserPointer } from "@/hooks/useLaserPointer";
import { LaserPointerLayer } from "@/components/canvas/LaserPointerLayer";

const LASER_COLOR = "#ff2b2b";

// Firefly — 전역 레이저 포인터 오버레이.
// 'R' 키를 누른 채 커서를 흔들거나(어느 페이지든), Clearing 툴바의 laser 툴을 켜면 활성.
// client(뷰포트) 좌표를 쓰므로 문서/캔버스/인라인 어디서든 커서 위에 표시된다.
export function LaserPointerOverlay() {
  const { updateLaser, awarenessStates, localUserId } = useCollaboration();
  const tool = useCanvasStore((state) => state.tool);

  const { localLaser, onScenePoint } = useLaserPointer({
    color: LASER_COLOR,
    toolActive: tool === "laser",
    updateLaser: updateLaser ?? (() => {}),
  });

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      onScenePoint({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [onScenePoint]);

  const remoteLasers = useMemo(
    () =>
      (awarenessStates ?? [])
        .filter(
          (st) =>
            st.userId !== localUserId &&
            st.laser &&
            Array.isArray(st.laser.points) &&
            st.laser.points.length > 0
        )
        .map((st) => ({ userId: st.userId, points: st.laser!.points, color: st.laser!.color })),
    [awarenessStates, localUserId]
  );

  return (
    <LaserPointerLayer
      lasers={[
        ...(localLaser
          ? [{ id: "__local", points: localLaser.points, color: localLaser.color, fadingOut: localLaser.fadingOut }]
          : []),
        ...remoteLasers.map((l) => ({ id: l.userId, points: l.points, color: l.color })),
      ]}
    />
  );
}
