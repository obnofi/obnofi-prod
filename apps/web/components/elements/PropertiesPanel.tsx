"use client";

import { useMemo } from "react";
import { useElementStore } from "@/store/useElementStore";
import type { ConnectorElement, LineStyle, ShapeElement } from "@obnofi/types/clearing";

export function PropertiesPanel({ elementId }: { elementId: string | null }) {
  const { elements, updateElement } = useElementStore();

  const selectedShape = useMemo(() => {
    const target = elements.find((element) => element.id === elementId);
    return target?.type === "shape" ? (target as ShapeElement) : null;
  }, [elementId, elements]);

  const selectedConnector = useMemo(() => {
    const target = elements.find((element) => element.id === elementId);
    return target?.type === "connector" ? (target as ConnectorElement) : null;
  }, [elementId, elements]);

  if (!selectedShape && !selectedConnector) {
    return null;
  }

  return (
    <aside className="w-[280px] rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
        Properties
      </p>
      <div className="mt-4 space-y-4">
        {selectedShape && (
          <>
            <label className="flex flex-col gap-2 text-sm">
              <span>Fill color</span>
              <input
                name="shape-fill-color"
                type="color"
                value={selectedShape.content.fill}
                onChange={(event) =>
                  updateElement(selectedShape.id, {
                    content: {
                      ...selectedShape.content,
                      fill: event.target.value,
                    },
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Border color</span>
              <input
                name="shape-border-color"
                type="color"
                value={selectedShape.style.color}
                onChange={(event) =>
                  updateElement(selectedShape.id, {
                    style: {
                      ...selectedShape.style,
                      color: event.target.value,
                    },
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Border width</span>
              <input
                name="shape-border-width"
                max={12}
                min={0}
                type="range"
                value={selectedShape.style.strokeWidth ?? 2}
                onChange={(event) =>
                  updateElement(selectedShape.id, {
                    style: {
                      ...selectedShape.style,
                      strokeWidth: Number(event.target.value),
                    },
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Opacity</span>
              <input
                name="shape-opacity"
                max={1}
                min={0.1}
                step={0.05}
                type="range"
                value={selectedShape.style.opacity}
                onChange={(event) =>
                  updateElement(selectedShape.id, {
                    style: {
                      ...selectedShape.style,
                      opacity: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          </>
        )}

        {selectedConnector && (
          <>
            <label className="flex flex-col gap-2 text-sm">
              <span>Line style</span>
              <div className="flex gap-2">
                {(["solid", "dashed", "dotted"] as LineStyle[]).map((style) => (
                  <button
                    key={style}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs transition ${
                      selectedConnector.content.lineStyle === style
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                    }`}
                    onClick={() =>
                      updateElement(selectedConnector.id, {
                        content: {
                          ...selectedConnector.content,
                          lineStyle: style,
                        },
                      })
                    }
                    type="button"
                  >
                    <svg className="h-3 w-6" viewBox="0 0 24 4">
                      <line
                        x1="0"
                        y1="2"
                        x2="24"
                        y2="2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={
                          style === "dashed" ? "6 3" : style === "dotted" ? "2 3" : undefined
                        }
                      />
                    </svg>
                    <span className="capitalize">{style}</span>
                  </button>
                ))}
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Line color</span>
              <input
                type="color"
                value={selectedConnector.style.color}
                onChange={(event) =>
                  updateElement(selectedConnector.id, {
                    style: {
                      ...selectedConnector.style,
                      color: event.target.value,
                    },
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Line width</span>
              <input
                max={12}
                min={1}
                type="range"
                value={selectedConnector.style.strokeWidth ?? 3}
                onChange={(event) =>
                  updateElement(selectedConnector.id, {
                    style: {
                      ...selectedConnector.style,
                      strokeWidth: Number(event.target.value),
                    },
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Arrows</span>
              <div className="flex gap-2">
                <button
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs transition ${
                    selectedConnector.content.arrowStart
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                  }`}
                  onClick={() =>
                    updateElement(selectedConnector.id, {
                      content: {
                        ...selectedConnector.content,
                        arrowStart: !selectedConnector.content.arrowStart,
                      },
                    })
                  }
                  type="button"
                >
                  <svg className="h-3 w-4" viewBox="0 0 16 8">
                    <path d="M 16 4 L 4 0 L 4 8 z" fill="currentColor" />
                  </svg>
                  Start
                </button>
                <button
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs transition ${
                    selectedConnector.content.arrowEnd
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                  }`}
                  onClick={() =>
                    updateElement(selectedConnector.id, {
                      content: {
                        ...selectedConnector.content,
                        arrowEnd: !selectedConnector.content.arrowEnd,
                      },
                    })
                  }
                  type="button"
                >
                  <svg className="h-3 w-4" viewBox="0 0 16 8">
                    <path d="M 0 4 L 12 0 L 12 8 z" fill="currentColor" />
                  </svg>
                  End
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Opacity</span>
              <input
                max={1}
                min={0.1}
                step={0.05}
                type="range"
                value={selectedConnector.style.opacity}
                onChange={(event) =>
                  updateElement(selectedConnector.id, {
                    style: {
                      ...selectedConnector.style,
                      opacity: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          </>
        )}
      </div>
    </aside>
  );
}
