"use client";

import { Plus } from "lucide-react";
import { Property, Page, SelectOption } from "@obnofi/types";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";

interface ListViewProps {
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

export function ListView({ properties, rows, onCreateRow, onOpenRow }: ListViewProps) {
  const statusProp = properties.find((p) => p.type === "select" || p.type === "status");
  const dateProp = properties.find((p) => p.type === "date");
  const tagProp = properties.find((p) => p.type === "multi_select");

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="flex h-full flex-col overflow-auto">
      {rows.map((row) => {
        const statusVal = statusProp ? getVal(row, statusProp.id) : undefined;
        const tagVal = tagProp ? getVal(row, tagProp.id) : undefined;
        const dateVal = dateProp ? getVal(row, dateProp.id) : undefined;

        const statusOptionId =
          statusVal && (statusVal.type === "select" || statusVal.type === "status")
            ? statusVal.optionId
            : null;
        const statusOption = statusOptionId
          ? statusProp?.options?.find((o) => o.id === statusOptionId)
          : null;

        const tagIds = tagVal?.type === "multi_select" ? tagVal.optionIds : [];
        const tags = tagIds
          .map((id) => tagProp?.options?.find((o) => o.id === id))
          .filter(Boolean) as SelectOption[];

        const dateStr = dateVal?.type === "date" ? dateVal.value : null;

        return (
          <div
            key={row.id}
            className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 transition hover:bg-[var(--color-hover)]"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                {row.title || "Untitled"}
              </span>
              {tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: getOptionBgColor(tag.color),
                        color: getOptionTextColor(tag.color),
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {dateStr && (
                <span className="text-xs text-[var(--color-text-secondary)]">{fmtDate(dateStr)}</span>
              )}
              {statusOption && (
                <span
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: getOptionBgColor(statusOption.color),
                    color: getOptionTextColor(statusOption.color),
                  }}
                >
                  {statusOption.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => void onCreateRow?.()}
        className="flex items-center gap-1.5 px-4 py-3 text-[13px] text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
      >
        <Plus className="h-3.5 w-3.5" />
        New
      </button>
    </div>
  );
}
