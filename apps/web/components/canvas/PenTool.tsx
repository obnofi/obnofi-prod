"use client";

import { useMemo, useRef, useState } from "react";
import { screenToCanvas } from "@/lib/coordinateUtils";
import {
  normalizePathPoints,
  simplifyPath,
  type PathPoint,
} from "@/lib/pathUtils";
import type { Viewport } from "@/store/useCanvasStore";
import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import type { Element } from "@obnofi/types/clearing";

type DrawingToolMode = "pen" | "marker";

type PenToolProps = {
  activeTool: DrawingToolMode | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  color: string;
  currentUserId: string | null;
  roomId: string | null;
  strokeWidth: number;
  viewport: Viewport;
  zIndex: number;
  onPathCreated: (element: Element) => void;
};

export function PenTool({
  activeTool,
  boardRef,
  color,
  currentUserId,
  roomId,
  strokeWidth,
  viewport,
  zIndex,
  onPathCreated,
}: PenToolProps) {
  const drawingPointerIdRef = useRef<number | null>(null);
  const pointsRef = useRef<PathPoint[]>([]);
  const [points, setPoints] = useState<PathPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const opacity = useMemo(
    () => (activeTool === "marker" ? 0.5 : 1),
    [activeTool]
  );

  const effectiveStrokeWidth = useMemo(() => {
    if (activeTool === "marker") {
      return strokeWidth || 16;
    }
    if (activeTool === "pen") {
      return strokeWidth || 2;
    }
    return strokeWidth;
  }, [activeTool, strokeWidth]);

  const appendPoint = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const point = screenToCanvas(clientX, clientY, viewport, rect);
    const nextPoints = [...pointsRef.current, point];
    pointsRef.current = nextPoints;
    setPoints(nextPoints);
  };

  const resetDrawing = () => {
    pointsRef.current = [];
    setPoints([]);
    setIsDrawing(false);
    drawingPointerIdRef.current = null;
  };

  const finalizePath = () => {
    const finalizedPoints = pointsRef.current;

    if (!roomId || !currentUserId || finalizedPoints.length < 2) {
      resetDrawing();
      return;
    }

    const simplified = simplifyPath(
      finalizedPoints,
      activeTool === "marker" ? 2.8 : 1.6
    );
    const normalized = normalizePathPoints(simplified);

    const nextElement: Element = {
      id: crypto.randomUUID(),
      roomId,
      type: "path",
      x: normalized.x,
      y: normalized.y,
      width: normalized.width,
      height: normalized.height,
      rotation: 0,
      zIndex,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      style: {
        color,
        strokeWidth: effectiveStrokeWidth,
        opacity,
      },
      content: {
        kind: "path",
        points: normalized.points,
        closed: false,
      },
    };

    onPathCreated(nextElement);
    resetDrawing();
  };

  if (!activeTool) {
    return <DrawingCanvas color={color} opacity={opacity} points={[]} strokeWidth={effectiveStrokeWidth} viewport={viewport} visible={false} />;
  }

  return (
    <>
      <div
        className="absolute inset-0 z-20"
        style={{ cursor: activeTool === "marker" ? "crosshair" : "crosshair" }}
        onPointerDown={(event) => {
          if (!boardRef.current || event.button !== 0) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          drawingPointerIdRef.current = event.pointerId;
          pointsRef.current = [];
          setPoints([]);
          setIsDrawing(true);
          appendPoint(event.clientX, event.clientY);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!isDrawing || drawingPointerIdRef.current !== event.pointerId) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          appendPoint(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (drawingPointerIdRef.current !== event.pointerId) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          appendPoint(event.clientX, event.clientY);
          finalizePath();
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerLeave={(event) => {
          if (drawingPointerIdRef.current !== event.pointerId) {
            return;
          }

          finalizePath();
        }}
      />
      <DrawingCanvas
        color={color}
        opacity={opacity}
        points={points}
        strokeWidth={effectiveStrokeWidth}
        viewport={viewport}
        visible={isDrawing}
      />
    </>
  );
}
