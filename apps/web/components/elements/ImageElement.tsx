"use client";

import { useRef } from "react";
import { ResizeHandles, type ResizeHandlePosition } from "@/components/elements/ResizeHandles";
import { useElementStore } from "@/store/useElementStore";
import type { ImageElement as ImageElementType } from "@obnofi/types/clearing";

const MIN_IMAGE_WIDTH = 120;

export function ImageElement({
  element,
  isSelected,
  scale,
  onPointerDown,
}: {
  element: ImageElementType;
  isSelected: boolean;
  scale: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
}) {
  const startRef = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const { updateElement } = useElementStore();

  const handleResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: ResizeHandlePosition
  ) => {
    event.preventDefault();
    event.stopPropagation();

    startRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };

    const aspectRatio = element.content.aspectRatio || element.width / element.height;

    const onMove = (moveEvent: PointerEvent) => {
      if (!startRef.current) {
        return;
      }

      const deltaX = (moveEvent.clientX - startRef.current.pointerX) / scale;
      const deltaY = (moveEvent.clientY - startRef.current.pointerY) / scale;
      const cornerHandle = ["nw", "ne", "se", "sw"].includes(handle);

      let nextWidth = startRef.current.width;
      let nextHeight = startRef.current.height;
      let nextX = startRef.current.x;
      let nextY = startRef.current.y;

      if (handle.includes("e")) {
        nextWidth = Math.max(MIN_IMAGE_WIDTH, startRef.current.width + deltaX);
      }
      if (handle.includes("w")) {
        nextWidth = Math.max(MIN_IMAGE_WIDTH, startRef.current.width - deltaX);
        nextX = startRef.current.x + (startRef.current.width - nextWidth);
      }

      if (cornerHandle) {
        nextHeight = nextWidth / aspectRatio;
        if (handle.includes("n")) {
          nextY = startRef.current.y + (startRef.current.height - nextHeight);
        }
      } else {
        if (handle.includes("s")) {
          nextHeight = Math.max(80, startRef.current.height + deltaY);
        }
        if (handle.includes("n")) {
          nextHeight = Math.max(80, startRef.current.height - deltaY);
          nextY = startRef.current.y + (startRef.current.height - nextHeight);
        }
      }

      updateElement(element.id, {
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
        updatedAt: new Date().toISOString(),
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      startRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className="group relative h-full w-full cursor-grab active:cursor-grabbing"
      style={{
        opacity: element.style.opacity,
      }}
    >
      <div
        className={`relative h-full w-full overflow-hidden border bg-[var(--color-board-card)] shadow-sm ${
          isSelected ? "ring-2 ring-[var(--color-accent)]" : ""
        }`}
        style={{
          borderRadius: `${element.content.borderRadius}%`,
        }}
      >
        <img
          alt={element.content.alt}
          className="h-full w-full"
          src={element.content.src}
          style={{ objectFit: element.content.objectFit }}
          draggable={false}
        />
        {isSelected ? <ResizeHandles onHandlePointerDown={handleResize} /> : null}
      </div>
    </div>
  );
}
