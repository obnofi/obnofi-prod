"use client";

import type { Point } from "@obnofi/types/clearing";

export function CursorChat({
  color,
  cursor,
  draft,
  isFadingOut = false,
  isEditing = false,
  maxLength = 52,
  message,
  onCancel,
  onChange,
  onSubmit,
}: {
  color: string;
  cursor: Point;
  draft?: string;
  isFadingOut?: boolean;
  isEditing?: boolean;
  maxLength?: number;
  message?: string | null;
  onCancel?: () => void;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-[10020] transition-opacity duration-200 ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        left: cursor.x + 10,
        top: cursor.y + 18,
      }}
    >
      {isEditing ? (
        <div
          className="pointer-events-auto inline-flex h-[26px] max-w-[180px] items-center rounded-[9px] px-2 py-1 text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          <input
            name="cursor-chat-message"
            autoFocus
            className="h-full w-[160px] bg-transparent text-[11px] font-bold leading-none text-white outline-none placeholder:text-white/75"
            placeholder="Say something..."
            value={draft ?? ""}
            maxLength={maxLength}
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
