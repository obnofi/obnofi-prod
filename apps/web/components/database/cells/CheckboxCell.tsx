"use client";

import { Check } from "lucide-react";

interface CheckboxCellProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function CheckboxCell({ value, onChange }: CheckboxCellProps) {
  return (
    <label className="flex h-full items-center justify-center px-2">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border transition-colors ${
          value
            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-text-secondary)]"
        }`}
      >
        {value && <Check className="h-3.5 w-3.5" />}
      </button>
    </label>
  );
}
