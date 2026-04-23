"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { useElementStore } from "@/store/useElementStore";
import { ResizeHandles, type ResizeHandlePosition } from "@/components/elements/ResizeHandles";
import { VoteBadge } from "@/components/elements/VoteBadge";
import type { StickyElement } from "@obnofi/types/clearing";

type ToneKey = "sun" | "rose" | "sky";

const MIN_STICKY_HEIGHT = 210;
const MIN_STICKY_WIDTH = 180;
const STICKY_VERTICAL_CHROME = 112;

const TONE_COLORS: Record<ToneKey, { surface: string; border: string; text: string }> = {
  sun:  { surface: "#FFF1A8", border: "#E8D56A", text: "#4D4113" },
  rose: { surface: "#FFD9E6", border: "#F1ABC0", text: "#5B2A3C" },
  sky:  { surface: "#DDF1FF", border: "#A8CFE8", text: "#1C4660" },
};

type StickyPatch = Partial<StickyElement>;

async function persistSticky(element: StickyElement, patch: StickyPatch) {
  if (!isSupabaseConfigured()) return;

  const nextElement = {
    ...element,
    ...patch,
    style: {
      ...element.style,
      ...patch.style,
    },
    content: {
      ...element.content,
      ...patch.content,
    },
    updatedAt: new Date().toISOString(),
  };

  const supabase = createBrowserSupabaseClient();
  await supabase.from("elements").upsert(
    {
      id: nextElement.id,
      room_id: nextElement.roomId,
      type: nextElement.type,
      x: nextElement.x,
      y: nextElement.y,
      width: nextElement.width,
      height: nextElement.height,
      rotation: nextElement.rotation,
      z_index: nextElement.zIndex,
      created_by: nextElement.createdBy,
      style: nextElement.style,
      content: nextElement.content,
      created_at: nextElement.createdAt,
      updated_at: nextElement.updatedAt,
    },
    { onConflict: "id" }
  );
}

function buildResizedFrame(
  element: StickyElement,
  handle: ResizeHandlePosition,
  deltaX: number,
  deltaY: number
) {
  let nextX = element.x;
  let nextY = element.y;
  let nextWidth = element.width;
  let nextHeight = element.height;

  if (handle.includes("e")) {
    nextWidth = Math.max(MIN_STICKY_WIDTH, element.width + deltaX);
  }
  if (handle.includes("s")) {
    nextHeight = Math.max(MIN_STICKY_HEIGHT, element.height + deltaY);
  }
  if (handle.includes("w")) {
    nextWidth = Math.max(MIN_STICKY_WIDTH, element.width - deltaX);
    nextX = element.x + (element.width - nextWidth);
  }
  if (handle.includes("n")) {
    nextHeight = Math.max(MIN_STICKY_HEIGHT, element.height - deltaY);
    nextY = element.y + (element.height - nextHeight);
  }

  return {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
}

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
      className={`relative h-full rounded-[22px] border p-5 shadow-sm transition ${
        isSelected ? "ring-2 ring-[var(--color-accent)]" : "ring-0"
      }`}
      style={{ backgroundColor: tone.surface, borderColor: tone.border, color: tone.text }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
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
