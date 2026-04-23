"use client";

import { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { SelectOption } from "@obnofi/types/database";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";
import { DropdownPortal } from "@/components/database/DropdownPortal";

interface MultiSelectCellProps {
  value: string[];
  options: SelectOption[];
  onChange: (optionIds: string[]) => void;
}

export function MultiSelectCell({ value, options, onChange }: MultiSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOptions = options.filter((opt) => value.includes(opt.id));

  const toggleOption = (optionId: string) => {
    onChange(value.includes(optionId) ? value.filter((id) => id !== optionId) : [...value, optionId]);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full min-h-[36px] items-center gap-1 rounded border border-transparent px-2 py-1 text-left text-sm transition hover:bg-[var(--color-hover)]"
      >
        <div className="flex flex-wrap items-center gap-1 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: getOptionBgColor(option.color), color: getOptionTextColor(option.color) }}
              >
                {option.label}
                <span
                  onClick={(e) => { e.stopPropagation(); onChange(value.filter((id) => id !== option.id)); }}
                  className="cursor-pointer rounded hover:bg-black/10"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="text-[var(--color-text-secondary)] py-0.5">Empty</span>
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" />
      </button>

      <DropdownPortal triggerRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="min-w-[10rem] max-w-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">No options</div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-hover)]"
                >
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: getOptionBgColor(option.color), color: getOptionTextColor(option.color) }}
                  >
                    {option.label}
                  </span>
                  {isSelected && <span className="ml-auto text-[var(--color-accent)]">✓</span>}
                </button>
              );
            })
          )}
        </div>
      </DropdownPortal>
    </div>
  );
}
