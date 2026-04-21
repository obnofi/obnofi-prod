"use client";

import type { Table } from "@tanstack/react-table";
import { ImageIcon, Plus } from "lucide-react";
import { Page, Property } from "@/types";
import { getPropertyValueData } from "@/hooks/useGroveTable";

interface GalleryViewProps {
  table: Table<Page>;
  properties: Property[];
  onCreateRow?: () => void | Promise<void>;
  onOpenRow?: (rowId: string) => void;
}

function getCoverUrl(row: Page, properties: Property[]) {
  const coverProperty = properties.find(
    (property) => property.type === "files" || property.type === "url"
  );

  if (!coverProperty) {
    return null;
  }

  const value = getPropertyValueData(row, coverProperty.id);
  if (!value) {
    return null;
  }

  if (value.type === "files") {
    return value.files[0]?.url ?? null;
  }

  if (value.type === "url") {
    return value.value || null;
  }

  return null;
}

export function GalleryView({
  table,
  properties,
  onCreateRow,
  onOpenRow,
}: GalleryViewProps) {
  const rows = table.getPreGroupedRowModel().rows;
  const previewProperties = properties.slice(0, 3);

  return (
    <div className="grid h-full content-start gap-4 overflow-auto p-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
      {rows.map((rowModel) => {
        const row = rowModel.original;
        const coverUrl = getCoverUrl(row, properties);

        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onOpenRow?.(row.id)}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-left transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-40 items-center justify-center overflow-hidden bg-[var(--color-surface)]">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={row.title || "Untitled"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--color-text-placeholder)]">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">No cover field</span>
                </div>
              )}
            </div>
            <div className="space-y-3 p-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {row.title || "Untitled"}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {row.propertyValues?.length ?? 0} properties
                </p>
              </div>
              <div className="space-y-2">
                {previewProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="truncate text-[var(--color-text-secondary)]">
                      {property.name}
                    </span>
                    <span className="truncate text-right text-[var(--color-text-primary)]">
                      {String(
                        table
                          .getRowModel()
                          .flatRows.find((item) => item.id === rowModel.id)
                          ?.getValue(property.id) ?? ""
                      ) || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => void onCreateRow?.()}
        className="flex min-h-[280px] items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
      >
        <Plus className="h-4 w-4" />
        Plant Seed
      </button>
    </div>
  );
}
