"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { ResizeHandles, type ResizeHandlePosition } from "@/components/elements/ResizeHandles";
import { useElementStore } from "@/store/useElementStore";
import type { ShapeElement } from "@obnofi/types/clearing";

type ShapePatch = Partial<ShapeElement>;

const MIN_SIZE = 48;

async function persistShape(shape: ShapeElement, patch?: ShapePatch) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const nextShape = {
    ...shape,
    ...patch,
    style: {
      ...shape.style,
      ...patch?.style,
    },
    content: {
      ...shape.content,
      ...patch?.content,
    },
    updatedAt: new Date().toISOString(),
  };

  const supabase = createBrowserSupabaseClient();
  await supabase.from("elements").upsert(
    {
      id: nextShape.id,
      room_id: nextShape.roomId,
      type: nextShape.type,
      x: nextShape.x,
      y: nextShape.y,
      width: nextShape.width,
      height: nextShape.height,
      rotation: nextShape.rotation,
      z_index: nextShape.zIndex,
      created_by: nextShape.createdBy,
      style: nextShape.style,
      content: nextShape.content,
      created_at: nextShape.createdAt,
      updated_at: nextShape.updatedAt,
    },
    { onConflict: "id" }
  );
}

function buildResizedFrame(
  shape: ShapeElement,
  handle: ResizeHandlePosition,
  deltaX: number,
  deltaY: number
) {
  let nextX = shape.x;
  let nextY = shape.y;
  let nextWidth = shape.width;
  let nextHeight = shape.height;

  if (handle.includes("e")) {
    nextWidth = Math.max(MIN_SIZE, shape.width + deltaX);
  }
  if (handle.includes("s")) {
    nextHeight = Math.max(MIN_SIZE, shape.height + deltaY);
  }
  if (handle.includes("w")) {
    nextWidth = Math.max(MIN_SIZE, shape.width - deltaX);
    nextX = shape.x + (shape.width - nextWidth);
  }
  if (handle.includes("n")) {
    nextHeight = Math.max(MIN_SIZE, shape.height - deltaY);
    nextY = shape.y + (shape.height - nextHeight);
  }

  return {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
}

export function ShapeTool({
  element,
  isSelected,
  scale,
}: {
  element: ShapeElement;
  isSelected: boolean;
  scale: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(element.content.label);
  const [isEditing, setIsEditing] = useState(false);
  const { updateElement } = useElementStore();

  useEffect(() => {
    if (!isEditing) {
      draftRef.current = element.content.label;
    }
  }, [element.content.label, isEditing]);

  useEffect(() => {
    if (!isEditing || !contentRef.current) {
      return;
    }

    contentRef.current.focus();
    document.getSelection()?.selectAllChildren(contentRef.current);
    document.getSelection()?.collapseToEnd();
  }, [isEditing]);

  const renderedShape = useMemo(() => {
    if (element.content.shape === "ellipse") {
      return {
        borderRadius: "999px",
        transform: undefined,
        clipPath: undefined,
      };
    }

    if (element.content.shape === "diamond") {
      return {
        borderRadius: "20px",
        transform: "rotate(45deg)",
        clipPath: undefined,
      };
    }

    if (element.content.shape === "triangle") {
      return {
        borderRadius: undefined,
        transform: undefined,
        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      };
    }

    return {
      borderRadius: "28px",
      transform: undefined,
      clipPath: undefined,
    };
  }, [element.content.shape]);

  const commitLabel = () => {
    const next = draftRef.current.trim();
    if (next !== element.content.label) {
      const patch: ShapePatch = {
        content: { ...element.content, label: next },
        updatedAt: new Date().toISOString(),
      };
      updateElement(element.id, patch);
      void persistShape(element, patch);
    }
    setIsEditing(false);
  };

  const handleResizeStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: ResizeHandlePosition
  ) => {
    event.stopPropagation();
    event.preventDefault();

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
      void persistShape(element, patch);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className="group relative h-full w-full cursor-grab active:cursor-grabbing transform-gpu transition-[box-shadow,transform] duration-150 will-change-transform"
      style={{
        opacity: element.style.opacity,
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
    >
      <div className="relative h-full w-full">
        <div
          className={`absolute inset-0 border-2 shadow-sm transition ${
            isSelected ? "ring-2 ring-[var(--color-accent)]" : ""
          }`}
          style={{
            backgroundColor: element.content.fill,
            borderColor: element.style.color,
            borderWidth: element.style.strokeWidth ?? 2,
            borderRadius: renderedShape.borderRadius,
            transform: renderedShape.transform,
            clipPath: renderedShape.clipPath,
            transformOrigin: "center",
          }}
        />

        <div
          ref={contentRef}
          className="absolute inset-0 flex items-center justify-center px-6 text-center text-xl font-semibold leading-tight outline-none"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={commitLabel}
          onInput={(event) => {
            draftRef.current = event.currentTarget.textContent ?? "";
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              draftRef.current = element.content.label;
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
          {element.content.label}
        </div>

        {isSelected ? <ResizeHandles onHandlePointerDown={handleResizeStart} /> : null}
      </div>
    </div>
  );
}
