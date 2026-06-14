"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { useElementStore } from "@/store/useElementStore";
import type { TextElement } from "@obnofi/types/clearing";

const MIN_TEXT_WIDTH = 180;
const MAX_TEXT_WIDTH = 480;
const MIN_TEXT_HEIGHT = 48;
const TEXT_HORIZONTAL_CHROME = 20;

async function persistText(element: TextElement, patch?: Partial<TextElement>) {
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

export function TextTool({
  element,
  isSelected,
  autoEdit = false,
}: {
  element: TextElement;
  isSelected: boolean;
  autoEdit?: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
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
    syncBoxSize();
  }, [isEditing]);

  const measureBoxSize = () => {
    if (!contentRef.current) {
      return { width: element.width, height: element.height };
    }

    const measuredWidth = Math.max(
      MIN_TEXT_WIDTH,
      Math.min(MAX_TEXT_WIDTH, contentRef.current.scrollWidth + TEXT_HORIZONTAL_CHROME)
    );
    const measuredHeight = Math.max(MIN_TEXT_HEIGHT, contentRef.current.scrollHeight);

    return {
      width: Math.max(element.width, measuredWidth),
      height: Math.max(element.height, measuredHeight),
    };
  };

  const syncBoxSize = () => {
    const nextBox = measureBoxSize();
    if (
      Math.abs(nextBox.width - element.width) <= 1 &&
      Math.abs(nextBox.height - element.height) <= 1
    ) {
      return nextBox;
    }

    updateElement(element.id, {
      width: nextBox.width,
      height: nextBox.height,
      updatedAt: new Date().toISOString(),
    });

    return nextBox;
  };

  const commitText = () => {
    const nextBox = measureBoxSize();
    const patch: Partial<TextElement> = {
      width: nextBox.width,
      height: nextBox.height,
      content: {
        ...element.content,
        text: draftRef.current,
      },
      updatedAt: new Date().toISOString(),
    };
    updateElement(element.id, patch);
    void persistText(element, patch);
    setIsEditing(false);
  };

  return (
    <div
      className="relative min-h-full w-full cursor-text"
      style={{
        minHeight: element.height,
        opacity: element.style.opacity,
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
    >
      <div
        ref={contentRef}
        className={`whitespace-pre-wrap break-words rounded-xl px-2 py-1 leading-tight outline-none ${
          isSelected ? "ring-2 ring-[var(--color-accent)]" : ""
        }`}
        contentEditable={isEditing}
        suppressContentEditableWarning
        style={{
          color: element.style.color,
          fontSize: element.content.fontSize,
          fontWeight: element.content.weight,
          textAlign: element.content.align,
        }}
        onBlur={commitText}
        onInput={(event) => {
          draftRef.current = event.currentTarget.textContent ?? "";
          syncBoxSize();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            syncBoxSize();
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
  );
}
