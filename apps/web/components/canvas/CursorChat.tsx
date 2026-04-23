"use client";

import type { Point } from "@obnofi/types/clearing";

export function CursorChat({
  color,
  cursor,
  draft,
  isEditing = false,
  message,
  onCancel,
  onChange,
  onSubmit,
}: {
  color: string;
  cursor: Point;
  draft?: string;
  isEditing?: boolean;
  message?: string | null;
  onCancel?: () => void;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: cursor.x + 14,
        top: cursor.y - 6,
      }}
    >
      {isEditing ? (
        <div className="pointer-events-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 shadow-lg">
          <input
            autoFocus
            className="w-48 bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
            placeholder="Say something..."
            value={draft ?? ""}
            onBlur={onCancel}
            onChange={(event) => onChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onCancel?.();
              }

              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit?.();
              }
            }}
          />
        </div>
      ) : message ? (
        <div
          className="max-w-56 rounded-2xl px-3 py-2 text-xs font-medium text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
