"use client";

import { PropertyValueData, SelectOption } from "@obnofi/types/database";
import { formatPropertyValue } from "@/lib/property-utils";

interface ComputedCellProps {
  value: PropertyValueData;
  options?: SelectOption[];
}

// Read-only cell for computed properties (formula, rollup, created_by, etc.)
export function ComputedCell({ value, options }: ComputedCellProps) {
  const displayValue = formatPropertyValue(value, options);

  return (
    <div className="flex h-8 items-center px-2 text-[13px] text-[var(--color-text-secondary)]">
      {displayValue || "—"}
    </div>
  );
}
