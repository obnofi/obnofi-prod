"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { useElementStore } from "@/store/useElementStore";
import type { VineElement } from "@obnofi/types/clearing";

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
}: {
  element: VineElement;
  isSelected: boolean;
  autoEdit?: boolean;
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

  const syncFrame = () => {
    if (!contentRef.current) {
      return;
    }

    const nextWidth = Math.max(160, Math.min(340, contentRef.current.scrollWidth + 48));
    const nextHeight = Math.max(64, contentRef.current.scrollHeight + 28);
    updateElement(element.id, {
      width: nextWidth,
      height: nextHeight,
      updatedAt: new Date().toISOString(),
    });
  };

  const commitText = () => {
    const patch: Partial<VineElement> = {
      width: contentRef.current ? Math.max(160, Math.min(340, contentRef.current.scrollWidth + 48)) : element.width,
      height: contentRef.current ? Math.max(64, contentRef.current.scrollHeight + 28) : element.height,
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

  return (
    <div
      className={`relative h-full w-full ${isEditing ? "cursor-text" : "cursor-grab"}`}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
    >
      <div
        className={`absolute inset-0 rounded-[999px] border shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${
          isSelected ? "ring-2 ring-[var(--color-accent)]" : ""
        }`}
        style={{
          backgroundColor: element.content.fill,
          borderColor: element.style.color,
          opacity: element.style.opacity,
        }}
      />
      {!isEditing && !element.content.text && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center px-6 leading-tight" style={{ color: "var(--color-text-tertiary)", fontSize: element.content.fontSize, fontWeight: element.content.weight }}>
          Mind map
        </div>
      )}
      <div
        ref={contentRef}
        className="relative flex min-h-full items-center justify-center whitespace-pre-wrap break-words px-6 text-center leading-tight outline-none"
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
  );
}
