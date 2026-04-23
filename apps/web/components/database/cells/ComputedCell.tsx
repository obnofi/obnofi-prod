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
    <div className="px-2 py-1.5 text-sm text-zinc-500 dark:text-zinc-400">
      {displayValue || "—"}
    </div>
  );
}
