"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { ResizeHandles, type ResizeHandlePosition } from "@/components/elements/ResizeHandles";
import { useElementStore } from "@/store/useElementStore";
import type { VineElement } from "@obnofi/types/clearing";

const MIN_VINE_WIDTH = 160;
const MAX_VINE_WIDTH = 340;
const MIN_VINE_HEIGHT = 64;
const VINE_HORIZONTAL_CHROME = 48;
const VINE_VERTICAL_CHROME = 28;

function buildResizedFrame(
  element: VineElement,
  handle: ResizeHandlePosition,
  deltaX: number,
  deltaY: number
) {
  let nextX = element.x;
  let nextY = element.y;
  let nextWidth = element.width;
  let nextHeight = element.height;

  if (handle.includes("e")) {
    nextWidth = Math.max(MIN_VINE_WIDTH, element.width + deltaX);
  }
  if (handle.includes("s")) {
    nextHeight = Math.max(MIN_VINE_HEIGHT, element.height + deltaY);
  }
  if (handle.includes("w")) {
    nextWidth = Math.max(MIN_VINE_WIDTH, element.width - deltaX);
    nextX = element.x + (element.width - nextWidth);
  }
  if (handle.includes("n")) {
    nextHeight = Math.max(MIN_VINE_HEIGHT, element.height - deltaY);
    nextY = element.y + (element.height - nextHeight);
  }

  return { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
}

async function persistVine(element: VineElement, patch?: Partial<VineElement>) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const nextElement = {
    ...element,
    ...patch,
    style: {
      ...element.style,
      ...patch?.style,
    },
    content: {
      ...element.content,
      ...patch?.content,
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

export function VineTool({
  element,
  isSelected,
  autoEdit = false,
  scale,
}: {
  element: VineElement;
  isSelected: boolean;
  autoEdit?: boolean;
  scale: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(element.content.text);
  const hasTriggeredAutoEditRef = useRef(false);
  const [isEditing, setIsEditing] = useState(autoEdit || element.content.text.length === 0);
  const { updateElement } = useElementStore();

  useEffect(() => {
    hasTriggeredAutoEditRef.current = false;
  }, [element.id]);

  useEffect(() => {
    if (!isEditing) {
      draftRef.current = element.content.text;
    }
  }, [element.content.text, isEditing]);

  useEffect(() => {
    if (!autoEdit || isEditing || hasTriggeredAutoEditRef.current) {
      return;
    }
    hasTriggeredAutoEditRef.current = true;
    setIsEditing(true);
  }, [autoEdit, isEditing]);

  useEffect(() => {
    if (!isEditing || !contentRef.current) {
      return;
    }

    contentRef.current.focus();
    document.getSelection()?.selectAllChildren(contentRef.current);
    document.getSelection()?.collapseToEnd();
    syncFrame();
  }, [isEditing]);

  const measureFrame = () => {
    if (!contentRef.current) {
      return { width: element.width, height: element.height };
    }

    const measuredWidth = Math.max(
      MIN_VINE_WIDTH,
      Math.min(MAX_VINE_WIDTH, contentRef.current.scrollWidth + VINE_HORIZONTAL_CHROME)
    );
    const measuredHeight = Math.max(
      MIN_VINE_HEIGHT,
      contentRef.current.scrollHeight + VINE_VERTICAL_CHROME
    );

    return {
      width: Math.max(element.width, measuredWidth),
      height: Math.max(element.height, measuredHeight),
    };
  };

  const syncFrame = () => {
    const nextFrame = measureFrame();
    if (
      Math.abs(nextFrame.width - element.width) <= 1 &&
      Math.abs(nextFrame.height - element.height) <= 1
    ) {
      return nextFrame;
    }

    updateElement(element.id, {
      width: nextFrame.width,
      height: nextFrame.height,
      updatedAt: new Date().toISOString(),
    });

    return nextFrame;
  };

  const commitText = () => {
    const nextFrame = measureFrame();
    const patch: Partial<VineElement> = {
      width: nextFrame.width,
      height: nextFrame.height,
      content: {
        ...element.content,
        text: draftRef.current.trim(),
      },
      updatedAt: new Date().toISOString(),
    };
    updateElement(element.id, patch);
    void persistVine(element, patch);
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
      void persistVine(element, patch);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className={`relative h-full w-full transform-gpu transition-[box-shadow,transform] duration-150 will-change-transform ${
        isEditing ? "cursor-text" : "cursor-grab"
      }`}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
    >
      <div
        className={`absolute inset-0 rounded-[999px] border shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] duration-150 ${
          isSelected ? "ring-2 ring-[var(--color-accent)]" : ""
        }`}
        style={{
          backgroundColor: element.content.fill,
          borderColor: element.style.color,
          opacity: element.style.opacity,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          ref={contentRef}
          className="relative max-w-full whitespace-pre-wrap break-words text-center leading-tight outline-none"
          contentEditable={isEditing}
          suppressContentEditableWarning
          style={{
            color: "var(--color-text-primary)",
            fontSize: element.content.fontSize,
            fontWeight: element.content.weight,
          }}
          onBlur={commitText}
          onInput={(event) => {
            draftRef.current = event.currentTarget.textContent ?? "";
            syncFrame();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              syncFrame();
              commitText();
            }
            if (event.key === "Escape") {
              draftRef.current = element.content.text;
              setIsEditing(false);
            }
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
        >
          {element.content.text}
        </div>
      </div>
      {isSelected && !isEditing ? (
        <ResizeHandles onHandlePointerDown={handleResizeStart} />
      ) : null}
    </div>
  );
}
