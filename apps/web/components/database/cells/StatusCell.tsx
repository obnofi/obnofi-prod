"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SelectOption } from "@obnofi/types/database";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";
import { DropdownPortal } from "@/components/database/DropdownPortal";

interface StatusCellProps {
  value: string | null;
  options: SelectOption[];
  onChange: (optionId: string | null) => void;
}

export function StatusCell({ value, options, onChange }: StatusCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-1 rounded border border-transparent px-2 py-1.5 text-left text-sm transition hover:bg-[var(--color-hover)]"
      >
        {selectedOption ? (
          <div className="flex w-full items-center gap-2 rounded px-2 py-1" style={{ backgroundColor: getOptionBgColor(selectedOption.color) }}>
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getOptionTextColor(selectedOption.color) }} />
            <span className="text-sm font-medium" style={{ color: getOptionTextColor(selectedOption.color) }}>{selectedOption.label}</span>
          </div>
        ) : (
          <span className="text-[var(--color-text-secondary)]">Empty</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" />
      </button>

      <DropdownPortal triggerRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="min-w-[10rem] max-w-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <button type="button" onClick={() => { onChange(null); setIsOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]">
            Empty
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { onChange(option.id); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-hover)]"
            >
              <div className="flex flex-1 items-center gap-2 rounded px-2 py-1" style={{ backgroundColor: getOptionBgColor(option.color) }}>
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getOptionTextColor(option.color) }} />
                <span className="text-sm font-medium" style={{ color: getOptionTextColor(option.color) }}>{option.label}</span>
              </div>
              {value === option.id && <span className="text-[var(--color-accent)]">✓</span>}
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
}
