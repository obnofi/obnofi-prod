"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SelectOption } from "@obnofi/types/database";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";
import { DropdownPortal } from "@/components/database/DropdownPortal";

interface SelectCellProps {
  value: string | null;
  options: SelectOption[];
  onChange: (optionId: string | null) => void;
  allowEmpty?: boolean;
}

export function SelectCell({ value, options, onChange, allowEmpty = true }: SelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-8 w-full items-center justify-between gap-1 rounded-md border border-transparent px-2 text-left text-[13px] transition hover:bg-[var(--color-hover)]"
      >
        {selectedOption ? (
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-[12px] font-medium"
            style={{ backgroundColor: getOptionBgColor(selectedOption.color), color: getOptionTextColor(selectedOption.color) }}
          >
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-[var(--color-text-secondary)]">Empty</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" />
      </button>

      <DropdownPortal triggerRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="min-w-[10rem] max-w-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
          {allowEmpty && (
            <button
              type="button"
              onClick={() => { onChange(null); setIsOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
            >
              Empty
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { onChange(option.id); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-hover)]"
            >
              <span
                className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: getOptionBgColor(option.color), color: getOptionTextColor(option.color) }}
              >
                {option.label}
              </span>
              {value === option.id && <span className="ml-auto text-[var(--color-accent)]">✓</span>}
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
}
