"use client";

import type { ResizeHandle } from "./sectionTypes";

const HANDLE_SIZE = 10;

export function SectionResizeHandle({
  position,
  cursor,
  isSelected,
  onPointerDown,
}: {
  position: ResizeHandle;
  cursor: string;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent, handle: ResizeHandle) => void;
}) {
  return (
    <div
      className={`absolute z-10 rounded-full bg-white border-2 border-[var(--color-accent)] transition-opacity ${
        isSelected ? "opacity-100" : "opacity-0"
      }`}
      style={{
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        cursor,
        ...(position === "nw" && { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }),
        ...(position === "ne" && { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }),
        ...(position === "sw" && { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }),
        ...(position === "se" && { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }),
        ...(position === "n" && { top: -HANDLE_SIZE / 2, left: "50%", transform: "translateX(-50%)" }),
        ...(position === "s" && { bottom: -HANDLE_SIZE / 2, left: "50%", transform: "translateX(-50%)" }),
        ...(position === "w" && { left: -HANDLE_SIZE / 2, top: "50%", transform: "translateY(-50%)" }),
        ...(position === "e" && { right: -HANDLE_SIZE / 2, top: "50%", transform: "translateY(-50%)" }),
      }}
      onPointerDown={(e) => onPointerDown(e, position)}
    />
  );
}
