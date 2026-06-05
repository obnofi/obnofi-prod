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
      name="text-cell"
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:bg-[var(--color-background)] focus:ring-1 focus:ring-[var(--color-border)]"
    />
  );
}
