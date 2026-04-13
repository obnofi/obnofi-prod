"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PencilRuler,
  Trash2,
  Undo2,
} from "lucide-react";

interface CanvasProps {
  content: object | null;
  onUpdate?: (content: object) => void;
  compact?: boolean;
}

type Tool = "select" | "brush" | "eraser" | "line" | "rect" | "ellipse";

interface Point {
  x: number;
  y: number;
}

interface StrokeLayer {
  id: string;
  kind: "stroke";
  points: Point[];
  color: string;
  size: number;
}

interface ShapeLayer {
  id: string;
  kind: "shape";
  shape: "line" | "rect" | "ellipse";
  start: Point;
  end: Point;
  color: string;
  size: number;
}

type CanvasLayer = StrokeLayer | ShapeLayer;

interface CanvasDocument {
  version: 2;
  layers: CanvasLayer[];
}

const PALETTE = [
  "#111110",
  "#2E7D45",
  "#2563EB",
  "#DC2626",
  "#D97706",
  "#7C3AED",
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
    )
  );
  const projectionX = start.x + t * dx;
  const projectionY = start.y + t * dy;

  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

function getPointFromEvent(
  event: React.PointerEvent<HTMLDivElement>,
  element: HTMLDivElement | null
) {
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function strokeToPath(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y} L ${point.x + 0.01} ${point.y + 0.01}`;
  }

  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
}

function normalizeLegacyContent(content: object | null): CanvasDocument {
  if (!content) {
    return { version: 2, layers: [] };
  }

  const maybeCanvas = content as Partial<CanvasDocument> & {
    shapes?: Array<{
      id: string;
      type: "rect" | "circle" | "arrow";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
    }>;
  };

  if (Array.isArray(maybeCanvas.layers)) {
    return {
      version: 2,
      layers: maybeCanvas.layers,
    };
  }

  if (Array.isArray(maybeCanvas.shapes)) {
    return {
      version: 2,
      layers: maybeCanvas.shapes.map((shape) => ({
        id: shape.id,
        kind: "shape" as const,
        shape:
          shape.type === "circle"
            ? "ellipse"
            : shape.type === "arrow"
            ? "line"
            : "rect",
        start: { x: shape.x, y: shape.y },
        end: { x: shape.x + shape.width, y: shape.y + shape.height },
        color: shape.color,
        size: 3,
      })),
    };
  }

  return { version: 2, layers: [] };
}

function isPointNearLayer(layer: CanvasLayer, point: Point) {
  if (layer.kind === "stroke") {
    for (let index = 0; index < layer.points.length - 1; index += 1) {
      if (
        distanceToSegment(point, layer.points[index], layer.points[index + 1]) <=
        Math.max(layer.size, 10)
      ) {
        return true;
      }
    }
    return false;
  }

  const minX = Math.min(layer.start.x, layer.end.x) - Math.max(layer.size, 10);
  const maxX = Math.max(layer.start.x, layer.end.x) + Math.max(layer.size, 10);
  const minY = Math.min(layer.start.y, layer.end.y) - Math.max(layer.size, 10);
  const maxY = Math.max(layer.start.y, layer.end.y) + Math.max(layer.size, 10);

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

function renderShape(layer: ShapeLayer) {
  const x = Math.min(layer.start.x, layer.end.x);
  const y = Math.min(layer.start.y, layer.end.y);
  const width = Math.abs(layer.end.x - layer.start.x);
  const height = Math.abs(layer.end.y - layer.start.y);

  if (layer.shape === "line") {
    return (
      <line
        key={layer.id}
        x1={layer.start.x}
        y1={layer.start.y}
        x2={layer.end.x}
        y2={layer.end.y}
        stroke={layer.color}
        strokeWidth={layer.size}
        strokeLinecap="round"
      />
    );
  }

  if (layer.shape === "rect") {
    return (
      <rect
        key={layer.id}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill={`${layer.color}18`}
        stroke={layer.color}
        strokeWidth={layer.size}
      />
    );
  }

  return (
    <ellipse
      key={layer.id}
      cx={x + width / 2}
      cy={y + height / 2}
      rx={width / 2}
      ry={height / 2}
      fill={`${layer.color}18`}
      stroke={layer.color}
      strokeWidth={layer.size}
    />
  );
}

export function Canvas({ content, onUpdate, compact = false }: CanvasProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#2E7D45");
  const [size, setSize] = useState(4);
  const [activeLayer, setActiveLayer] = useState<CanvasLayer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<CanvasLayer[][]>([]);

  useEffect(() => {
    const normalized = normalizeLegacyContent(content);
    setLayers(normalized.layers);
  }, [content]);

  useEffect(() => {
    if (compact) {
      setTool("brush");
    }
  }, [compact]);

  const persistLayers = (nextLayers: CanvasLayer[]) => {
    setLayers(nextLayers);
    onUpdate?.({
      version: 2,
      layers: nextLayers,
    });
  };

  const pushHistory = () => {
    setHistory((current) => [...current.slice(-29), layers]);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getPointFromEvent(event, boardRef.current);
    if (!point) {
      return;
    }

    if (tool === "select") {
      return;
    }

    if (tool === "eraser") {
      pushHistory();
      setIsDrawing(true);
      setLayers((current) =>
        current.filter((layer) => !isPointNearLayer(layer, point))
      );
      return;
    }

    pushHistory();
    setIsDrawing(true);

    if (tool === "brush") {
      setActiveLayer({
        id: createId("stroke"),
        kind: "stroke",
        points: [point],
        color,
        size,
      });
      return;
    }

    setActiveLayer({
      id: createId("shape"),
      kind: "shape",
      shape: tool === "line" ? "line" : tool === "rect" ? "rect" : "ellipse",
      start: point,
      end: point,
      color,
      size,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getPointFromEvent(event, boardRef.current);
    if (!point || !isDrawing) {
      return;
    }

    if (tool === "eraser") {
      setLayers((current) =>
        current.filter((layer) => !isPointNearLayer(layer, point))
      );
      return;
    }

    setActiveLayer((current) => {
      if (!current) {
        return current;
      }

      if (current.kind === "stroke") {
        return {
          ...current,
          points: [...current.points, point],
        };
      }

      return {
        ...current,
        end: point,
      };
    });
  };

  const finishDrawing = () => {
    if (!isDrawing) {
      return;
    }

    setIsDrawing(false);

    if (tool === "eraser") {
      onUpdate?.({ version: 2, layers });
      return;
    }

    if (!activeLayer) {
      return;
    }

    if (activeLayer.kind === "stroke" && activeLayer.points.length < 2) {
      setActiveLayer(null);
      return;
    }

    const nextLayers = [...layers, activeLayer];
    setActiveLayer(null);
    persistLayers(nextLayers);
  };

  const handleClear = () => {
    if (layers.length === 0) {
      return;
    }

    pushHistory();
    persistLayers([]);
  };

  const handleUndo = () => {
    setHistory((current) => {
      const previous = current[current.length - 1];
      if (!previous) {
        return current;
      }

      persistLayers(previous);
      return current.slice(0, -1);
    });
  };

  const renderedLayers = useMemo(() => {
    return activeLayer ? [...layers, activeLayer] : layers;
  }, [activeLayer, layers]);

  return (
    <div data-testid={compact ? "inline-canvas" : "workspace-canvas"} className="flex h-full flex-col bg-white dark:bg-[#111110]">
      <div
        ref={boardRef}
        data-testid="canvas-board"
        className={`relative flex-1 overflow-hidden ${
          tool === "select" ? "cursor-default" : "cursor-crosshair"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerLeave={finishDrawing}
      >
        <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white/92 px-3 py-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/92">
          <div className="flex items-center gap-2">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  color === swatch
                    ? "scale-110 border-zinc-900 dark:border-white"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: swatch }}
                aria-label={`Select color ${swatch}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
            <PencilRuler className="h-4 w-4 text-zinc-400" />
            <input
              type="range"
              min={2}
              max={24}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            />
            <span className="w-7 text-xs text-zinc-500 dark:text-zinc-400">{size}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Undo2 className="h-4 w-4" />
              {compact ? <span className="hidden sm:inline">Undo</span> : "Undo"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              {compact ? <span className="hidden sm:inline">Clear</span> : "Clear"}
            </button>
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(46,125,69,0.16) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <svg className="absolute inset-0 h-full w-full touch-none">
          {renderedLayers.map((layer) =>
            layer.kind === "stroke" ? (
              <path
                key={layer.id}
                d={strokeToPath(layer.points)}
                fill="none"
                stroke={layer.color}
                strokeWidth={layer.size}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              renderShape(layer)
            )
          )}
        </svg>

      </div>
    </div>
  );
}
