"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { useElementStore } from "@/store/useElementStore";
import type { TextElement } from "@obnofi/types/clearing";

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
  onPointerDown,
}: {
  element: TextElement;
  isSelected: boolean;
  autoEdit?: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(element.content.text);
  const [isEditing, setIsEditing] = useState(autoEdit || element.content.text.length === 0);
  const { updateElement } = useElementStore();

  useEffect(() => {
    if (!isEditing) {
      draftRef.current = element.content.text;
    }
  }, [element.content.text, isEditing]);

  useEffect(() => {
    if (!autoEdit || isEditing) {
      return;
    }
    setIsEditing(true);
  }, [autoEdit, isEditing]);

  useEffect(() => {
    if (!isEditing || !contentRef.current) {
      return;
    }

    contentRef.current.focus();
    document.getSelection()?.selectAllChildren(contentRef.current);
    document.getSelection()?.collapseToEnd();
  }, [isEditing]);

  const syncBoxSize = () => {
    if (!contentRef.current) {
      return;
    }

    const nextHeight = Math.max(48, contentRef.current.scrollHeight);
    const nextWidth = Math.max(180, Math.min(480, contentRef.current.scrollWidth + 20));
    updateElement(element.id, {
      width: nextWidth,
      height: nextHeight,
      updatedAt: new Date().toISOString(),
    });
  };

  const commitText = () => {
    const patch: Partial<TextElement> = {
      width: element.width,
      height: contentRef.current ? Math.max(48, contentRef.current.scrollHeight) : element.height,
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
        className={`min-h-[48px] whitespace-pre-wrap break-words rounded-xl px-2 py-1 leading-tight outline-none ${
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
