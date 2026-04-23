"use client";

import { useEffect, useRef } from "react";
import type { Viewport } from "@/store/useCanvasStore";
import { catmullRomToBezierPath, type PathPoint } from "@/lib/pathUtils";

export function DrawingCanvas({
  color,
  opacity,
  points,
  strokeWidth,
  viewport,
  visible,
}: {
  color: string;
  opacity: number;
  points: PathPoint[];
  strokeWidth: number;
  viewport: Viewport;
  visible: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    if (!visible || points.length === 0) {
      return;
    }

    const screenPoints = points.map((point) => ({
      x: viewport.x + point.x * viewport.scale,
      y: viewport.y + point.y * viewport.scale,
    }));
    const pathData = catmullRomToBezierPath(screenPoints);
    const path = new Path2D(pathData);

    context.globalAlpha = opacity;
    context.strokeStyle = color;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = strokeWidth * viewport.scale;
    context.stroke(path);
  }, [color, opacity, points, strokeWidth, viewport, visible]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
    />
  );
}
