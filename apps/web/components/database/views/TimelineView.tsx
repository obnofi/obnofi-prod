"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Property, Page } from "@obnofi/types";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";

interface TimelineViewProps {
  properties: Property[];
  rows: Page[];
  onCreateRow?: () => void | Promise<void>;
  onOpenRow?: (rowId: string) => void;
}

function getVal(row: Page, propId: string) {
  return row.propertyValues?.find(
    (pv) => pv.propertyId === propId || pv.columnId === propId
  )?.value;
}

const MS_PER_DAY = 86400000;

export function TimelineView({ properties, rows, onCreateRow }: TimelineViewProps) {
  const dateProp = properties.find((p) => p.type === "date");
  const statusProp = properties.find((p) => p.type === "select" || p.type === "status");

  const { minMs, totalDays, dateHeaders } = useMemo(() => {
    let minMs = Infinity;
    let maxMs = -Infinity;

    if (dateProp) {
      rows.forEach((row) => {
        const val = getVal(row, dateProp.id);
        if (val?.type === "date") {
          if (val.value) {
            const t = new Date(val.value).getTime();
            if (t < minMs) minMs = t;
            if (t > maxMs) maxMs = t;
          }
          if (val.endValue) {
            const t = new Date(val.endValue).getTime();
            if (t > maxMs) maxMs = t;
          }
        }
      });
    }

    const now = Date.now();
    if (!isFinite(minMs)) minMs = now;
    if (!isFinite(maxMs)) maxMs = now + 30 * MS_PER_DAY;

    // 3-day padding
    const paddedMin = minMs - 3 * MS_PER_DAY;
    const paddedMax = maxMs + 3 * MS_PER_DAY;
    const totalDays = Math.max(1, Math.ceil((paddedMax - paddedMin) / MS_PER_DAY));

    // Weekly date headers
    const dateHeaders: { label: string; pct: number }[] = [];
    let cur = paddedMin;
    while (cur <= paddedMax) {
      const pct = ((cur - paddedMin) / MS_PER_DAY / totalDays) * 100;
      dateHeaders.push({
        label: new Date(cur).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        pct,
      });
      cur += 7 * MS_PER_DAY;
    }

    return { minMs: paddedMin, totalDays, dateHeaders };
  }, [dateProp, rows]);

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      {/* Date header */}
      <div className="mb-3 flex">
        <div className="w-44 shrink-0" />
        <div className="relative h-6 flex-1">
          {dateHeaders.map(({ label, pct }) => (
            <span
              key={label}
              className="absolute -translate-x-1/2 text-[11px] text-[var(--color-text-secondary)]"
              style={{ left: `${pct}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const dateVal = dateProp ? getVal(row, dateProp.id) : undefined;
          const statusVal = statusProp ? getVal(row, statusProp.id) : undefined;

          const startStr = dateVal?.type === "date" ? dateVal.value : null;
          const endStr = dateVal?.type === "date" ? (dateVal.endValue ?? dateVal.value) : null;

          const startOffset = startStr
            ? Math.max(0, (new Date(startStr).getTime() - minMs) / MS_PER_DAY)
            : 0;
          const barDays = startStr && endStr
            ? Math.max(1, (new Date(endStr).getTime() - new Date(startStr).getTime()) / MS_PER_DAY + 1)
            : 1;

          const leftPct = (startOffset / totalDays) * 100;
          const widthPct = Math.max((barDays / totalDays) * 100, 2);

          const statusOptionId =
            statusVal && (statusVal.type === "select" || statusVal.type === "status")
              ? statusVal.optionId
              : null;
          const statusOption = statusOptionId
            ? statusProp?.options?.find((o) => o.id === statusOptionId)
            : null;

          return (
            <div key={row.id} className="flex items-center gap-3">
              <div className="w-44 shrink-0 truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                {row.title || "Untitled"}
              </div>
              <div className="relative h-8 flex-1 rounded-full bg-[var(--color-hover)]">
                {startStr && (
                  <div
                    className="absolute top-1 flex h-6 items-center rounded-full px-2.5"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: statusOption
                        ? getOptionBgColor(statusOption.color)
                        : "var(--color-accent-subtle)",
                      color: statusOption
                        ? getOptionTextColor(statusOption.color)
                        : "var(--color-accent)",
                    }}
                  >
                    <span className="truncate text-[11px] font-medium">
                      {statusOption?.label ?? ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => void onCreateRow?.()}
          className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>
    </div>
  );
}
