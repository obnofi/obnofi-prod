"use client";

export function ContextMenu({
  onBringForward,
  onDelete,
  onSendBackward,
  x,
  y,
}: {
  onBringForward: () => void;
  onDelete: () => void;
  onSendBackward: () => void;
  x: number;
  y: number;
}) {
  return (
    <div
      className="fixed z-50 min-w-[180px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl"
      style={{ left: x, top: y }}
    >
      <button
        className="flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--color-hover)]"
        type="button"
        onClick={onBringForward}
      >
        Bring forward
      </button>
      <button
        className="flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--color-hover)]"
        type="button"
        onClick={onSendBackward}
      >
        Send backward
      </button>
      <button
        className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-[var(--color-hover)]"
        type="button"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}
