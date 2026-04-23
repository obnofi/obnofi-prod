"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useElementStore } from "@/store/useElementStore";
import type { SectionElement } from "@obnofi/types/clearing";

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e";

const HANDLE_SIZE = 10;
const HEADER_HEIGHT = 36;

// Section color presets - Figma style
const SECTION_COLORS = [
  { name: "Fern", color: "#2E7D45", bg: "rgba(46,125,69,0.08)" },
  { name: "Ocean", color: "#1E3A5F", bg: "rgba(30,58,95,0.08)" },
  { name: "Berry", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  { name: "Sun", color: "#D97706", bg: "rgba(217,119,6,0.08)" },
  { name: "Orchid", color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  { name: "Slate", color: "#475569", bg: "rgba(71,85,105,0.08)" },
];

export function SectionTool({
  element,
  isSelected,
  onPointerDown,
  onResize,
}: {
  element: SectionElement;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
  onResize?: (elementId: string, updates: { x: number; y: number; width: number; height: number }) => void;
}) {
  const titleRef = useRef<HTMLDivElement>(null);
  const [draftTitle, setDraftTitle] = useState(element.content.title);
  const [editing, setEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; clientX: number; clientY: number } | null>(null);
  const { updateElement } = useElementStore();

  useEffect(() => {
    setDraftTitle(element.content.title);
  }, [element.content.title]);

  useEffect(() => {
    if (editing && titleRef.current) {
      titleRef.current.focus();
      document.getSelection()?.selectAllChildren(titleRef.current);
      document.getSelection()?.collapseToEnd();
    }
  }, [editing]);

  // Parse background color and create variations
  const baseColor = element.content.background || "rgba(46,125,69,0.08)";
  const headerColor = element.style.color || "#2E7D45";

  // Extract RGB from rgba for border color
  const getBorderColor = (color: string) => {
    if (color.startsWith("rgba")) {
      return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),[^)]+\)/, "rgba($1, $2, $3, 0.4)");
    }
    return color;
  };

  const handleResizeStart = useCallback((event: React.PointerEvent, handle: ResizeHandle) => {
    event.stopPropagation();
    event.preventDefault();

    setIsResizing(true);
    setActiveHandle(handle);
    resizeStartRef.current = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  }, [element]);

  const handleResizeMove = useCallback((event: PointerEvent) => {
    if (!isResizing || !resizeStartRef.current || !activeHandle) return;

    const start = resizeStartRef.current;
    const deltaX = (event.clientX - start.clientX);
    const deltaY = (event.clientY - start.clientY);

    let newX = start.x;
    let newY = start.y;
    let newWidth = start.width;
    let newHeight = start.height;

    // Minimum dimensions
    const minWidth = 120;
    const minHeight = 80;

    switch (activeHandle) {
      case "se":
        newWidth = Math.max(minWidth, start.width + deltaX);
        newHeight = Math.max(minHeight, start.height + deltaY);
        break;
      case "sw":
        newWidth = Math.max(minWidth, start.width - deltaX);
        newHeight = Math.max(minHeight, start.height + deltaY);
        newX = start.x + start.width - newWidth;
        break;
      case "ne":
        newWidth = Math.max(minWidth, start.width + deltaX);
        newHeight = Math.max(minHeight, start.height - deltaY);
        newY = start.y + start.height - newHeight;
        break;
      case "nw":
        newWidth = Math.max(minWidth, start.width - deltaX);
        newHeight = Math.max(minHeight, start.height - deltaY);
        newX = start.x + start.width - newWidth;
        newY = start.y + start.height - newHeight;
        break;
      case "n":
        newHeight = Math.max(minHeight, start.height - deltaY);
        newY = start.y + start.height - newHeight;
        break;
      case "s":
        newHeight = Math.max(minHeight, start.height + deltaY);
        break;
      case "w":
        newWidth = Math.max(minWidth, start.width - deltaX);
        newX = start.x + start.width - newWidth;
        break;
      case "e":
        newWidth = Math.max(minWidth, start.width + deltaX);
        break;
    }

    onResize?.(element.id, { x: newX, y: newY, width: newWidth, height: newHeight });
  }, [isResizing, activeHandle, element.id, onResize]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setActiveHandle(null);
    resizeStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", handleResizeMove);
      window.addEventListener("pointerup", handleResizeEnd);
      return () => {
        window.removeEventListener("pointermove", handleResizeMove);
        window.removeEventListener("pointerup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Resize handle component
  const ResizeHandleComponent = ({ position, cursor }: { position: ResizeHandle; cursor: string }) => (
    <div
      className={`absolute z-10 rounded-full bg-white border-2 border-[var(--color-accent)] transition-opacity ${
        isSelected ? "opacity-100" : "opacity-0"
      }`}
      style={{
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        cursor,
        ...(position === "nw" && { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 }),
        ...(position === "ne" && { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 }),
        ...(position === "sw" && { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 }),
        ...(position === "se" && { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 }),
        ...(position === "n" && { top: -HANDLE_SIZE/2, left: "50%", transform: "translateX(-50%)" }),
        ...(position === "s" && { bottom: -HANDLE_SIZE/2, left: "50%", transform: "translateX(-50%)" }),
        ...(position === "w" && { left: -HANDLE_SIZE/2, top: "50%", transform: "translateY(-50%)" }),
        ...(position === "e" && { right: -HANDLE_SIZE/2, top: "50%", transform: "translateY(-50%)" }),
      }}
      onPointerDown={(e) => handleResizeStart(e, position)}
    />
  );

  return (
    <div
      className="relative h-full w-full"
      style={{
        opacity: element.style.opacity,
      }}
    >
      {/* Main section container - Figma style */}
      <div
        className={`h-full w-full rounded-lg overflow-hidden ${isSelected ? "ring-2 ring-[var(--color-accent)]" : ""}`}
        style={{
          backgroundColor: baseColor,
          border: `2px solid ${getBorderColor(baseColor)}`,
        }}
      >
        {/* Header bar - Figma section style */}
        <div
          className="flex items-center px-3 h-9 border-b"
          style={{
            backgroundColor: headerColor,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <div
            ref={titleRef}
            className="text-sm font-semibold text-white outline-none flex-1 truncate"
            contentEditable={editing}
            suppressContentEditableWarning
            onBlur={() => {
              setEditing(false);
              updateElement(element.id, {
                content: {
                  ...element.content,
                  title: draftTitle.trim() || "Section",
                },
              });
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setEditing(true);
            }}
            onInput={(event) => setDraftTitle(event.currentTarget.textContent ?? "")}
            onPointerDown={(event) => {
              if (editing) {
                event.stopPropagation();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                titleRef.current?.blur();
              }
            }}
          >
            {draftTitle}
          </div>

          {/* Color picker button */}
          {isSelected && (
            <div className="relative ml-2">
              <button
                className="w-5 h-5 rounded-full border-2 border-white/50 hover:border-white transition-colors"
                style={{ backgroundColor: headerColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Change color"
              />

              {showColorPicker && (
                <>
                  <div
                    className="fixed inset-0 z-[998]"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-[999] p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg">
                    <div className="grid grid-cols-3 gap-1.5">
                      {SECTION_COLORS.map((preset) => (
                        <button
                          key={preset.name}
                          className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: preset.color,
                            borderColor: headerColor === preset.color ? "white" : "transparent",
                            boxShadow: headerColor === preset.color ? "0 0 0 2px var(--color-accent)" : "none",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElement(element.id, {
                              style: {
                                ...element.style,
                                color: preset.color,
                              },
                              content: {
                                ...element.content,
                                background: preset.bg,
                              },
                            });
                            setShowColorPicker(false);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content area - dotted grid pattern like Figma */}
        <div
          className="flex-1 h-[calc(100%-36px)]"
          style={{
            backgroundImage: `radial-gradient(circle, ${getBorderColor(baseColor)} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Resize handles - only show when selected */}
      <ResizeHandleComponent position="nw" cursor="nw-resize" />
      <ResizeHandleComponent position="ne" cursor="ne-resize" />
      <ResizeHandleComponent position="sw" cursor="sw-resize" />
      <ResizeHandleComponent position="se" cursor="se-resize" />
      <ResizeHandleComponent position="n" cursor="n-resize" />
      <ResizeHandleComponent position="s" cursor="s-resize" />
      <ResizeHandleComponent position="w" cursor="w-resize" />
      <ResizeHandleComponent position="e" cursor="e-resize" />
    </div>
  );
}
