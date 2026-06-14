"use client";

import { useEffect, useRef, useState } from "react";
import { useElementStore } from "@/store/useElementStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { ResizeHandles } from "@/components/elements/ResizeHandles";
import type { ResizeHandlePosition } from "@/components/elements/ResizeHandles";
import { VoteBadge } from "@/components/elements/VoteBadge";
import type { StickyElement } from "@obnofi/types/clearing";
import {
  persistSticky,
  buildResizedFrame,
  TONE_COLORS,
  MIN_STICKY_HEIGHT,
  STICKY_VERTICAL_CHROME,
  type ToneKey,
} from "@/lib/canvas/stickyToolUtils";

export function StickyTool({
  element,
  isSelected,
  onVote,
  scale,
}: {
  element: StickyElement;
  isSelected: boolean;
  onVote: (elementId: string) => void;
  scale: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(element.content.text);
  const heightRef = useRef(element.height);
  const [isEditing, setIsEditing] = useState(false);
  const { updateElement } = useElementStore();
  const { selectSingle } = useSelectionStore();
  const setSelectedElement = useCanvasStore((state) => state.setSelectedElement);

  const tone = TONE_COLORS[element.content.tone as ToneKey] ?? TONE_COLORS.sun;

  useEffect(() => {
    if (!isEditing) {
      draftRef.current = element.content.text;
      heightRef.current = element.height;
    }
  }, [element.content.text, element.height, isEditing]);

  useEffect(() => {
    if (!isEditing || !contentRef.current) return;
    contentRef.current.focus();
    document.getSelection()?.selectAllChildren(contentRef.current);
    document.getSelection()?.collapseToEnd();
    resizeToContent();
  }, [isEditing]);

  const getContentHeight = () => {
    if (!contentRef.current) {
      return element.height;
    }

    return Math.max(
      MIN_STICKY_HEIGHT,
      contentRef.current.scrollHeight + STICKY_VERTICAL_CHROME
    );
  };

  const resizeToContent = () => {
    const nextHeight = getContentHeight();
    heightRef.current = nextHeight;
    if (Math.abs(nextHeight - element.height) > 1) {
      updateElement(element.id, {
        height: nextHeight,
        updatedAt: new Date().toISOString(),
      });
    }
    return nextHeight;
  };

  const commitText = () => {
    const next = draftRef.current.trimEnd();
    const nextHeight = resizeToContent();
    if (next !== element.content.text || nextHeight !== element.height) {
      updateElement(element.id, {
        height: nextHeight,
        content: { ...element.content, text: next },
        updatedAt: new Date().toISOString(),
      });
      void persistSticky(element, {
        height: nextHeight,
        content: { ...element.content, text: next },
      });
    }
    setIsEditing(false);
  };

  const handleResizeStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: ResizeHandlePosition
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;

    const handleMove = (moveEvent: PointerEvent) => {
      const patch = buildResizedFrame(
        element,
        handle,
        (moveEvent.clientX - startX) / scale,
        (moveEvent.clientY - startY) / scale
      );
      updateElement(element.id, {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      const patch = buildResizedFrame(
        element,
        handle,
        (upEvent.clientX - startX) / scale,
        (upEvent.clientY - startY) / scale
      );
      updateElement(element.id, {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      void persistSticky(element, patch);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className={`relative h-full rounded-[22px] border p-5 shadow-sm transform-gpu transition-[box-shadow,transform] duration-150 will-change-transform ${
        isSelected ? "ring-2 ring-[var(--color-accent)]" : "ring-0"
      }`}
      style={{ backgroundColor: tone.surface, borderColor: tone.border, color: tone.text }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
      onPointerDown={(event) => {
        if (isEditing || event.button !== 0) return;

        selectSingle(element.id);
        setSelectedElement(element.id);
      }}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] opacity-40">
        Memo
      </p>
      <div
        ref={contentRef}
        className="min-h-[80px] whitespace-pre-wrap break-words text-base font-medium leading-7 outline-none"
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={commitText}
        onInput={(event) => {
          draftRef.current = event.currentTarget.textContent ?? "";
          resizeToContent();
        }}
        onPointerDown={(event) => {
          if (isEditing) event.stopPropagation();
        }}
        onPointerMove={(event) => {
          if (isEditing) event.stopPropagation();
        }}
        onPointerUp={(event) => {
          if (isEditing) event.stopPropagation();
        }}
        onKeyDown={(event) => {
          if (isEditing) event.stopPropagation();
          if (event.key === "Escape") {
            draftRef.current = element.content.text;
            setIsEditing(false);
          }
        }}
      >
        {element.content.text}
      </div>
      <VoteBadge
        count={Object.values(element.content.votes ?? {}).reduce((s, v) => s + v, 0)}
        onVote={() => onVote(element.id)}
        visible={isSelected}
      />
      {isSelected && !isEditing ? (
        <ResizeHandles onHandlePointerDown={handleResizeStart} />
      ) : null}
    </div>
  );
}
