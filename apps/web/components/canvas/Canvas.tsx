"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PencilRuler,
  Trash2,
  Undo2,
} from "lucide-react";
import { catmullRomToBezierPath } from "@/lib/pathUtils";
import type { Tool, CanvasLayer } from "@/lib/canvas/canvasTypes";
import { PALETTE } from "@/lib/canvas/canvasTypes";
import {
  createId,
  getPointFromEvent,
  isPointNearLayer,
  normalizeLegacyContent,
  renderShape,
} from "@/lib/canvas/canvasUtils";

interface CanvasProps {
  content: object | null;
  onUpdate?: (content: object) => void;
  compact?: boolean;
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

    event.currentTarget.setPointerCapture(event.pointerId);

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
              name="brush-size"
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
                d={catmullRomToBezierPath(layer.points)}
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
