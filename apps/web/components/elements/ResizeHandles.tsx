"use client";

export type ResizeHandlePosition =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

const HANDLE_LAYOUT: Array<{
  position: ResizeHandlePosition;
  className: string;
  cursor: string;
}> = [
  { position: "nw", className: "-left-2 -top-2", cursor: "nwse-resize" },
  { position: "n", className: "left-1/2 -top-2 -translate-x-1/2", cursor: "ns-resize" },
  { position: "ne", className: "-right-2 -top-2", cursor: "nesw-resize" },
  { position: "e", className: "-right-2 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { position: "se", className: "-bottom-2 -right-2", cursor: "nwse-resize" },
  { position: "s", className: "bottom-[-8px] left-1/2 -translate-x-1/2", cursor: "ns-resize" },
  { position: "sw", className: "-bottom-2 -left-2", cursor: "nesw-resize" },
  { position: "w", className: "-left-2 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
];

export function ResizeHandles({
  onHandlePointerDown,
}: {
  onHandlePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    position: ResizeHandlePosition
  ) => void;
}) {
  return (
    <>
      {HANDLE_LAYOUT.map((handle) => (
        <button
          key={handle.position}
          aria-label={`Resize from ${handle.position}`}
          className={`absolute z-40 h-4 w-4 rounded-full border-2 border-white bg-[var(--color-accent)] shadow-sm touch-none select-none ${handle.className}`}
          style={{ cursor: handle.cursor }}
          type="button"
          onPointerDown={(event) => onHandlePointerDown(event, handle.position)}
        />
      ))}
    </>
  );
}
