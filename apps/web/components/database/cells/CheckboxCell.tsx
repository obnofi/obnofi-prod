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
        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
          value
            ? "border-[#2E7D45] bg-[#2E7D45] text-white"
            : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
        }`}
      >
        {value && <Check className="h-3.5 w-3.5" />}
      </button>
    </label>
  );
}
