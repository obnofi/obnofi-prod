"use client";

import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface NumberCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  format?: "number" | "currency" | "percent";
  precision?: number;
}

export function NumberCell({
  value,
  onChange,
  placeholder = "0",
}: NumberCellProps) {
  const [localValue, setLocalValue] = useState(
    value !== null ? String(value) : ""
  );

  const debouncedOnChange = useDebounce(onChange, 300);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      
      // Allow empty, minus, decimal point during typing
      if (inputValue === "" || inputValue === "-" || inputValue === ".") {
        setLocalValue(inputValue);
        return;
      }

      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        setLocalValue(inputValue);
        debouncedOnChange(numValue);
      }
    },
    [debouncedOnChange]
  );

  const handleBlur = useCallback(() => {
    const numValue = localValue === "" ? null : parseFloat(localValue);
    if (numValue !== value) {
      onChange(numValue);
    }
    setLocalValue(numValue !== null ? String(numValue) : "");
  }, [localValue, value, onChange]);

  return (
    <input
      name="number-cell"
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:bg-[var(--color-background)] focus:ring-1 focus:ring-[var(--color-border)]"
    />
  );
}
