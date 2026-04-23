"use client";

import { useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { DropdownPortal } from "@/components/database/DropdownPortal";

interface DateCellProps {
  value: string | null;
  endValue?: string | null;
  includeTime?: boolean;
  onChange: (value: string | null, endValue?: string | null) => void;
}

export function DateCell({ value, endValue, onChange }: DateCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const formatDisplay = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayValue = value ? formatDisplay(value) : "";
  const displayEndValue = endValue ? formatDisplay(endValue) : "";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`flex w-full items-center gap-1.5 rounded border border-transparent px-2 py-1.5 text-left text-sm transition hover:bg-[var(--color-hover)] ${value ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {displayValue
            ? displayEndValue ? `${displayValue} → ${displayEndValue}` : displayValue
            : "Empty"}
        </span>
      </button>

      <DropdownPortal triggerRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Start date</label>
              <input
                type="date"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value || null, endValue ?? undefined)}
                className="w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">End date (optional)</label>
              <input
                type="date"
                value={endValue ?? ""}
                onChange={(e) => onChange(value, e.target.value || undefined)}
                className="w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-2">
              <button
                type="button"
                onClick={() => { onChange(null, undefined); setIsOpen(false); }}
                className="px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
}
