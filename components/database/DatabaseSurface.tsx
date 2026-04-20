"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, KanbanSquare, LayoutGrid, ListFilter, SlidersHorizontal, Table2 } from "lucide-react";
import type { PropertyType, ViewType, DatabasePage, PropertyValueData } from "@/types";
import { useGroveTable } from "@/hooks/useGroveTable";
import { TableView } from "@/components/database/TableView";
import { GalleryView } from "@/components/database/views/GalleryView";
import { BoardView } from "@/components/database/views/BoardView";
import { CalendarView } from "@/components/database/views/CalendarView";

type GroveSurfaceView = Extract<ViewType, "table" | "gallery" | "board" | "calendar">;

interface GroveSurfaceSnapshot {
  columns: Array<{ id: string; name: string; type: PropertyType; width?: number }>;
  rows: string[];
  filters: Array<{ id: string; value: unknown }>;
  sorts: Array<{ id: string; desc: boolean }>;
}

interface DatabaseSurfaceProps {
  databasePage: DatabasePage;
  compact?: boolean;
  initialViewType?: GroveSurfaceView;
  onViewTypeChange?: (viewType: GroveSurfaceView) => void;
  onSurfaceStateChange?: (snapshot: GroveSurfaceSnapshot) => void;
  onCreateRow?: () => void;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  onOpenRow?: (rowId: string) => void;
  onUpdatePropertyValue?: (
    rowId: string,
    propertyId: string,
    value: PropertyValueData
  ) => void;
}

const viewItems: Array<{
  id: GroveSurfaceView;
  label: string;
  icon: typeof Table2;
}> = [
  { id: "table", label: "Table", icon: Table2 },
  { id: "gallery", label: "Gallery", icon: LayoutGrid },
  { id: "board", label: "Kanban", icon: KanbanSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function DatabaseSurface({
  databasePage,
  compact = false,
  initialViewType = "table",
  onViewTypeChange,
  onSurfaceStateChange,
  onCreateRow,
  onCreateProperty,
  onOpenRow,
  onUpdatePropertyValue,
}: DatabaseSurfaceProps) {
  const properties = useMemo(
    () => [...databasePage.database.properties].sort((a, b) => a.order - b.order),
    [databasePage.database.properties]
  );
  const rows = databasePage.database.rows;
  const scopeId = `grove:${databasePage.database.id}`;
  const [viewType, setViewType] = useState<GroveSurfaceView>(initialViewType);
  const [isQueryPanelOpen, setIsQueryPanelOpen] = useState(false);

  const {
    table,
    queryState,
    activeFilterValue,
    setGlobalFilter,
    setGrouping,
    setSorting,
    setActiveFilterColumn,
    setActiveFilterValue,
    resetQuery,
  } = useGroveTable({
    scopeId,
    properties,
    rows,
    onOpenRow,
    onUpdatePropertyValue,
  });

  useEffect(() => {
    setViewType(initialViewType);
  }, [initialViewType]);

  useEffect(() => {
    onViewTypeChange?.(viewType);
  }, [onViewTypeChange, viewType]);

  useEffect(() => {
    if (viewType === "board" && queryState.grouping.length === 0) {
      const candidate = properties.find(
        (property) => property.type === "select" || property.type === "status"
      );
      if (candidate) {
        setGrouping(candidate.id);
      }
    }
  }, [properties, queryState.grouping.length, setGrouping, viewType]);

  useEffect(() => {
    onSurfaceStateChange?.({
      columns: properties.map((property) => ({
        id: property.id,
        name: property.name,
        type: property.type,
        width: queryState.columnSizing[property.id],
      })),
      rows: rows.map((row) => row.id),
      filters: queryState.columnFilters.map((filter) => ({
        id: String(filter.id),
        value: filter.value,
      })),
      sorts: queryState.sorting.map((sort) => ({
        id: sort.id,
        desc: sort.desc,
      })),
    });
  }, [
    onSurfaceStateChange,
    properties,
    queryState.columnFilters,
    queryState.columnSizing,
    queryState.sorting,
    rows,
  ]);

  const activeSort = queryState.sorting[0];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface)] p-1">
            {viewItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === viewType;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewType(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-[var(--color-background)] text-[var(--color-text-primary)] shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsQueryPanelOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          >
            {isQueryPanelOpen ? (
              <SlidersHorizontal className="h-4 w-4" />
            ) : (
              <ListFilter className="h-4 w-4" />
            )}
            Filter / Sort
          </button>
        </div>

        {isQueryPanelOpen ? (
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            <input
              type="search"
              value={queryState.globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search Grove Catalog"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)]"
            />
            <select
              value={queryState.activeFilterColumnId ?? ""}
              onChange={(event) => setActiveFilterColumn(event.target.value || null)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">Filter column</option>
              <option value="title">Plant Seed</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={activeFilterValue}
              onChange={(event) => setActiveFilterValue(event.target.value)}
              disabled={!queryState.activeFilterColumnId}
              placeholder="Contains..."
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)] disabled:cursor-not-allowed disabled:opacity-50 focus:border-[var(--color-accent)]"
            />
            <select
              value={activeSort?.id ?? ""}
              onChange={(event) =>
                setSorting(
                  event.target.value
                    ? [{ id: event.target.value, desc: activeSort?.desc ?? false }]
                    : []
                )
              }
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">Sort column</option>
              <option value="title">Plant Seed</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={activeSort?.desc ? "desc" : "asc"}
                onChange={(event) =>
                  activeSort
                    ? setSorting([
                        {
                          id: activeSort.id,
                          desc: event.target.value === "desc",
                        },
                      ])
                    : undefined
                }
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button
                type="button"
                onClick={resetQuery}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              >
                Reset
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        {viewType === "table" ? (
          <TableView
            table={table}
            properties={properties}
            onCreateRow={onCreateRow}
            onCreateProperty={onCreateProperty}
            compact={compact}
          />
        ) : null}
        {viewType === "gallery" ? (
          <GalleryView
            table={table}
            properties={properties}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
          />
        ) : null}
        {viewType === "board" ? (
          <BoardView
            table={table}
            properties={properties}
            groupByPropertyId={queryState.grouping[0]}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
            onUpdatePropertyValue={onUpdatePropertyValue}
          />
        ) : null}
        {viewType === "calendar" ? (
          <CalendarView
            table={table}
            properties={properties}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
          />
        ) : null}
      </div>
    </div>
  );
}
