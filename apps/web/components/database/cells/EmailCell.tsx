"use client";

import { useState, useCallback } from "react";
import { Mail } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface EmailCellProps {
  value: string;
  onChange: (value: string) => void;
}

export function EmailCell({ value, onChange }: EmailCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedOnChange = useDebounce(onChange, 300);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  if (!isFocused && value) {
    return (
      <a
        href={`mailto:${value}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#2E7D45] hover:underline"
      >
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{value}</span>
      </a>
    );
  }

  return (
    <div className="relative flex items-center">
      <Mail className="absolute left-2 h-3.5 w-3.5 text-zinc-400" />
      <input
        type="email"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="email@example.com"
        className="w-full rounded-md border border-transparent bg-transparent pl-7 pr-2 py-1.5 text-sm text-[#111110] outline-none transition focus:border-zinc-300 focus:bg-white dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
      />
    </div>
  );
}
