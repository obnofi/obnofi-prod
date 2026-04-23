"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { screenToCanvas, clampScale } from "@/lib/coordinateUtils";
import { useCanvasStore } from "@/store/useCanvasStore";

type BoardCanvasProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  gridSize?: number;
  minScale?: number;
  maxScale?: number;
  onCanvasPointerDown?: (
    event: React.PointerEvent<HTMLDivElement>,
    point: { x: number; y: number }
  ) => void;
  onCanvasPointerMove?: (
    event: React.PointerEvent<HTMLDivElement>,
    point: { x: number; y: number }
  ) => void;
  onCanvasPointerUp?: (
    event: React.PointerEvent<HTMLDivElement>,
    point: { x: number; y: number }
  ) => void;
};

type PanState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
} | null;

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function BoardCanvas({
  children,
  className,
  contentClassName,
  gridSize = 24,
  minScale = 0.1,
  maxScale = 5,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
}: BoardCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<PanState>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const { viewport, setViewport } = useCanvasStore();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncDevicePixelRatio = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };

    syncDevicePixelRatio();
    window.addEventListener("resize", syncDevicePixelRatio);

    return () => {
      window.removeEventListener("resize", syncDevicePixelRatio);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    const handleWindowBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }

    const preventWheelScroll = (event: WheelEvent) => {
      event.preventDefault();
    };

    node.addEventListener("wheel", preventWheelScroll, { passive: false });

    return () => {
      node.removeEventListener("wheel", preventWheelScroll);
    };
  }, []);

  const gridStyle = useMemo(() => {
    const scaledGrid = gridSize * viewport.scale;
    const dotSize = Math.max(1 / devicePixelRatio, 0.75);

    return {
      backgroundImage: `radial-gradient(circle, var(--color-border) ${dotSize}px, transparent ${dotSize}px)`,
      backgroundSize: `${scaledGrid}px ${scaledGrid}px`,
      backgroundPosition: `${viewport.x}px ${viewport.y}px`,
    };
  }, [devicePixelRatio, gridSize, viewport.scale, viewport.x, viewport.y]);

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!rootRef.current) {
      return;
    }

    event.preventDefault();
    rootRef.current.setPointerCapture(event.pointerId);
    panStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
    setIsPanning(true);
  };

  const finishPan = (pointerId: number) => {
    if (panStateRef.current?.pointerId !== pointerId) {
      return;
    }

    panStateRef.current = null;
    setIsPanning(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    const point = rect
      ? screenToCanvas(event.clientX, event.clientY, viewport, rect)
      : { x: 0, y: 0 };

    const shouldPan = event.button === 1 || (isSpacePressed && event.button === 0);
    if (shouldPan) {
      startPan(event);
      return;
    }

    onCanvasPointerDown?.(event, point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const activePan = panStateRef.current;
    if (activePan && activePan.pointerId === event.pointerId) {
      event.preventDefault();
      setViewport({
        x: activePan.originX + (event.clientX - activePan.startClientX),
        y: activePan.originY + (event.clientY - activePan.startClientY),
      });
    }

    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    onCanvasPointerMove?.(
      event,
      screenToCanvas(event.clientX, event.clientY, viewport, rect)
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      onCanvasPointerUp?.(
        event,
        screenToCanvas(event.clientX, event.clientY, viewport, rect)
      );
    }

    finishPan(event.pointerId);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    finishPan(event.pointerId);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const nextScale = clampScale(
      viewport.scale * Math.exp(-event.deltaY * 0.0015),
      { minScale, maxScale }
    );

    const cursorInCanvas = screenToCanvas(event.clientX, event.clientY, viewport, rect);

    setViewport({
      x: event.clientX - rect.left - cursorInCanvas.x * nextScale,
      y: event.clientY - rect.top - cursorInCanvas.y * nextScale,
      scale: nextScale,
    });
  };

  return (
    <div
      ref={rootRef}
      className={joinClassNames("relative h-full w-full overflow-hidden touch-none", className)}
      onContextMenu={(event) => {
        if (event.button === 1 || isSpacePressed) {
          event.preventDefault();
        }
      }}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      style={{
        cursor: isPanning ? "grabbing" : isSpacePressed ? "grab" : "default",
      }}
    >
      <div className="absolute inset-0" style={gridStyle} />
      <div
        className={joinClassNames("absolute left-0 top-0 origin-top-left will-change-transform", contentClassName)}
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
