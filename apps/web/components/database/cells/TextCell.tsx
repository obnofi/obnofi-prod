"use client";

import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface TextCellProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextCell({ value, onChange, placeholder }: TextCellProps) {
  const [localValue, setLocalValue] = useState(value);

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
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-[#111110] outline-none transition focus:border-zinc-300 focus:bg-white dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
    />
  );
}
