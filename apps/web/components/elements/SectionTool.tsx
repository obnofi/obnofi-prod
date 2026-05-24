"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useElementStore } from "@/store/useElementStore";
import type { SectionElement } from "@obnofi/types/clearing";
import { SECTION_COLORS, getBorderColor } from "@/lib/sectionColors";
import { SectionResizeHandle } from "./SectionResizeHandle";
import type { ResizeHandle } from "./sectionTypes";

export function SectionTool({
  element,
  isSelected,
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

  const baseColor = element.content.background || "rgba(46,125,69,0.08)";
  const headerColor = element.style.color || "#2E7D45";

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
    const deltaX = event.clientX - start.clientX;
    const deltaY = event.clientY - start.clientY;

    let newX = start.x;
    let newY = start.y;
    let newWidth = start.width;
    let newHeight = start.height;

    const minWidth = 120;
    const minHeight = 80;

    switch (activeHandle) {
      case "se": newWidth = Math.max(minWidth, start.width + deltaX); newHeight = Math.max(minHeight, start.height + deltaY); break;
      case "sw": newWidth = Math.max(minWidth, start.width - deltaX); newHeight = Math.max(minHeight, start.height + deltaY); newX = start.x + start.width - newWidth; break;
      case "ne": newWidth = Math.max(minWidth, start.width + deltaX); newHeight = Math.max(minHeight, start.height - deltaY); newY = start.y + start.height - newHeight; break;
      case "nw": newWidth = Math.max(minWidth, start.width - deltaX); newHeight = Math.max(minHeight, start.height - deltaY); newX = start.x + start.width - newWidth; newY = start.y + start.height - newHeight; break;
      case "n": newHeight = Math.max(minHeight, start.height - deltaY); newY = start.y + start.height - newHeight; break;
      case "s": newHeight = Math.max(minHeight, start.height + deltaY); break;
      case "w": newWidth = Math.max(minWidth, start.width - deltaX); newX = start.x + start.width - newWidth; break;
      case "e": newWidth = Math.max(minWidth, start.width + deltaX); break;
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

  const resizeHandles: Array<{ position: ResizeHandle; cursor: string }> = [
    { position: "nw", cursor: "nw-resize" },
    { position: "ne", cursor: "ne-resize" },
    { position: "sw", cursor: "sw-resize" },
    { position: "se", cursor: "se-resize" },
    { position: "n", cursor: "n-resize" },
    { position: "s", cursor: "s-resize" },
    { position: "w", cursor: "w-resize" },
    { position: "e", cursor: "e-resize" },
  ];

  return (
    <div className="relative h-full w-full" style={{ opacity: element.style.opacity }}>
      <div
        className={`h-full w-full rounded-lg overflow-hidden ${isSelected ? "ring-2 ring-[var(--color-accent)]" : ""}`}
        style={{
          backgroundColor: baseColor,
          border: `2px solid ${getBorderColor(baseColor)}`,
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center px-3 h-9 border-b"
          style={{ backgroundColor: headerColor, borderColor: "rgba(255,255,255,0.2)" }}
        >
          <div
            ref={titleRef}
            className="text-sm font-semibold text-white outline-none flex-1 truncate"
            contentEditable={editing}
            suppressContentEditableWarning
            onBlur={() => {
              setEditing(false);
              updateElement(element.id, {
                content: { ...element.content, title: draftTitle.trim() || "Section" },
              });
            }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
            onInput={(e) => setDraftTitle(e.currentTarget.textContent ?? "")}
            onPointerDown={(e) => { if (editing) e.stopPropagation(); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); titleRef.current?.blur(); } }}
          >
            {draftTitle}
          </div>

          {isSelected && (
            <div className="relative ml-2">
              <button
                className="w-5 h-5 rounded-full border-2 border-white/50 hover:border-white transition-colors"
                style={{ backgroundColor: headerColor }}
                onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Change color"
              />
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-[998]" onClick={() => setShowColorPicker(false)} />
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
                              style: { ...element.style, color: preset.color },
                              content: { ...element.content, background: preset.bg },
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

        {/* Content area */}
        <div
          className="flex-1 h-[calc(100%-36px)]"
          style={{
            backgroundImage: `radial-gradient(circle, ${getBorderColor(baseColor)} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {resizeHandles.map(({ position, cursor }) => (
        <SectionResizeHandle
          key={position}
          position={position}
          cursor={cursor}
          isSelected={isSelected}
          onPointerDown={handleResizeStart}
        />
      ))}
    </div>
  );
}
