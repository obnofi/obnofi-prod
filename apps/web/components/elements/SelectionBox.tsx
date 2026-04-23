"use client";

import type { SelectionBounds } from "@/store/useSelectionStore";

const HANDLE_POSITIONS = [
  "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
  "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
  "right-0 top-0 translate-x-1/2 -translate-y-1/2",
  "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
  "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
  "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
  "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
];

export function SelectionBox({
  bounds,
  scale,
}: {
  bounds: SelectionBounds;
  scale: number;
}) {
  if (!bounds) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute border-2 border-[var(--color-accent)]"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        boxShadow: "0 0 0 99999px rgba(46,125,69,0.03)",
      }}
    >
      {HANDLE_POSITIONS.map((position) => (
        <div
          key={position}
          className={`absolute h-3 w-3 rounded-full border-2 border-white bg-[var(--color-accent)] ${position}`}
          style={{ transform: `${position.includes("translate") ? "" : ""} scale(${1 / scale})` }}
        />
      ))}
    </div>
  );
}
