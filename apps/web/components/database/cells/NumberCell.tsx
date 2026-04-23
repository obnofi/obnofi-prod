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
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-[#111110] outline-none transition focus:border-zinc-300 focus:bg-white dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
    />
  );
}
