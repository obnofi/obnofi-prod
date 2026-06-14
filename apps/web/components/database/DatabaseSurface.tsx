"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  KanbanSquare,
  LayoutGrid,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import type {
  PropertyType,
  ViewType,
  DatabasePage,
  PropertyValueData,
  SelectOption,
  View,
  ViewConfig,
} from "@obnofi/types";
import { useGroveTable } from "@/hooks/useGroveTable";
import { TableView } from "@/components/database/TableView";
import { GalleryView } from "@/components/database/views/GalleryView";
import { BoardView } from "@/components/database/views/BoardView";
import { CalendarView } from "@/components/database/views/CalendarView";
import { DatabaseQueryPanel } from "@/components/database/DatabaseQueryPanel";

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
  readOnly?: boolean;
  initialViewType?: GroveSurfaceView;
  onViewTypeChange?: (viewType: GroveSurfaceView) => void;
  onSurfaceStateChange?: (snapshot: GroveSurfaceSnapshot) => void;
  onCreateRow?: () => void;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  onCreateView?: (input: {
    name: string;
    type: GroveSurfaceView;
  }) => Promise<View | undefined>;
  onUpdateView?: (
    viewId: string,
    input: Partial<Pick<View, "name" | "config">>
  ) => Promise<View | undefined>;
  onUpdateProperty?: (propertyId: string, updates: { name?: string; type?: PropertyType; options?: SelectOption[] }) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onMoveProperty?: (propertyId: string, direction: "left" | "right") => void;
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
  readOnly = false,
  initialViewType = "table",
  onViewTypeChange,
  onSurfaceStateChange,
  onCreateRow,
  onCreateProperty,
  onCreateView,
  onUpdateView,
  onUpdateProperty,
  onDeleteProperty,
  onMoveProperty,
  onOpenRow,
  onUpdatePropertyValue,
}: DatabaseSurfaceProps) {
  const properties = useMemo(
    () => [...databasePage.database.properties].sort((a, b) => a.order - b.order),
    [databasePage.database.properties]
  );
  const availableViewItems = useMemo(() => {
    const storedViews = databasePage.database.views ?? [];
    if (storedViews.length === 0) {
      return viewItems.filter((item) => item.id === "table");
    }

    return viewItems.filter((item) =>
      storedViews.some((view) => view.type === item.id)
    );
  }, [databasePage.database.views]);
  const [viewType, setViewType] = useState<GroveSurfaceView>(initialViewType);
  const selectedView =
    (databasePage.database.views ?? []).find((view) => view.type === viewType) ?? null;
  const fallbackVisiblePropertyIds = useMemo(
    () => properties.map((property) => property.id),
    [properties]
  );
  const selectedViewConfig = useMemo<ViewConfig>(
    () => ({
      visibleProperties: selectedView?.config?.visibleProperties ?? fallbackVisiblePropertyIds,
      propertyWidths: selectedView?.config?.propertyWidths ?? {},
      sorts: selectedView?.config?.sorts ?? [],
      filters: selectedView?.config?.filters ?? [],
      groupBy: selectedView?.config?.groupBy,
      boardColumns: selectedView?.config?.boardColumns,
      calendarBy: selectedView?.config?.calendarBy,
      timelineBy: selectedView?.config?.timelineBy,
    }),
    [fallbackVisiblePropertyIds, selectedView]
  );
  const visiblePropertyIds =
    selectedViewConfig.visibleProperties.length > 0
      ? selectedViewConfig.visibleProperties
      : fallbackVisiblePropertyIds;
  const visibleProperties = useMemo(
    () =>
      visiblePropertyIds
        .map((propertyId) => properties.find((property) => property.id === propertyId) ?? null)
        .filter((property): property is (typeof properties)[number] => property !== null),
    [properties, visiblePropertyIds]
  );
  const rows = databasePage.database.rows;
  const scopeId = `grove:${databasePage.database.id}:${selectedView?.id ?? viewType}`;
  const [isQueryPanelOpen, setIsQueryPanelOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isCreatingView, setIsCreatingView] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const lastPersistedViewConfigKeyRef = useRef<string>("");
  const viewConfigPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    table,
    queryState,
    activeFilterValue,
    setGlobalFilter,
    setSorting,
    setActiveFilterColumn,
    setActiveFilterValue,
    resetQuery,
  } = useGroveTable({
    scopeId,
    properties: visibleProperties,
    rows,
    onOpenRow,
    onUpdatePropertyValue,
  });

  useEffect(() => {
    setViewType(initialViewType);
  }, [initialViewType]);

  useEffect(() => {
    if (availableViewItems.some((item) => item.id === viewType)) {
      return;
    }

    setViewType(availableViewItems[0]?.id ?? "table");
  }, [availableViewItems, viewType]);

  useEffect(() => {
    onViewTypeChange?.(viewType);
  }, [onViewTypeChange, viewType]);

  useEffect(() => {
    if (!isViewMenuOpen && !isColumnMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isColumnMenuOpen, isViewMenuOpen]);

  useEffect(() => {
    return () => {
      if (viewConfigPersistTimerRef.current) {
        clearTimeout(viewConfigPersistTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    onSurfaceStateChange?.({
      columns: visibleProperties.map((property) => ({
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
    visibleProperties,
    queryState.columnFilters,
    queryState.columnSizing,
    queryState.sorting,
    rows,
  ]);

  useEffect(() => {
    if (!selectedView || !onUpdateView) {
      return;
    }

    const nextConfig: ViewConfig = {
      ...selectedViewConfig,
      visibleProperties: visiblePropertyIds,
      propertyWidths: visiblePropertyIds.reduce<Record<string, number>>((acc, propertyId) => {
        const width = queryState.columnSizing[propertyId];
        if (typeof width === "number") {
          acc[propertyId] = width;
        }
        return acc;
      }, {}),
      sorts: queryState.sorting.map((sort) => ({
        propertyId: sort.id,
        direction: sort.desc ? "descending" : "ascending",
      })),
      filters: queryState.columnFilters.map((filter) => ({
        propertyId: String(filter.id),
        operator: "contains" as const,
        value: filter.value,
      })),
    };

    const selectedConfigKey = JSON.stringify({
      visibleProperties: selectedViewConfig.visibleProperties,
      propertyWidths: selectedViewConfig.propertyWidths,
      sorts: selectedViewConfig.sorts,
      filters: selectedViewConfig.filters,
    });
    const nextConfigKey = JSON.stringify({
      visibleProperties: nextConfig.visibleProperties,
      propertyWidths: nextConfig.propertyWidths,
      sorts: nextConfig.sorts,
      filters: nextConfig.filters,
    });

    if (
      selectedConfigKey === nextConfigKey ||
      lastPersistedViewConfigKeyRef.current === nextConfigKey
    ) {
      return;
    }

    lastPersistedViewConfigKeyRef.current = nextConfigKey;
    if (viewConfigPersistTimerRef.current) {
      clearTimeout(viewConfigPersistTimerRef.current);
    }
    viewConfigPersistTimerRef.current = setTimeout(() => {
      void onUpdateView(selectedView.id, { config: nextConfig });
    }, 500);
  }, [
    onUpdateView,
    queryState.columnFilters,
    queryState.columnSizing,
    queryState.sorting,
    selectedView,
    selectedViewConfig,
    visiblePropertyIds,
  ]);

  const activeSort = queryState.sorting[0];
  const rowCountLabel = `${table.getRowModel().rows.length} ${table.getRowModel().rows.length === 1 ? "seed" : "seeds"}`;
  const missingViewItems = viewItems.filter(
    (item) => !availableViewItems.some((availableItem) => availableItem.id === item.id)
  );

  const handleCreateView = async (nextViewType: GroveSurfaceView) => {
    if (!onCreateView || isCreatingView) {
      return;
    }

    setIsCreatingView(true);
    try {
      const createdView = await onCreateView({
        type: nextViewType,
        name: viewItems.find((item) => item.id === nextViewType)?.label ?? nextViewType,
      });

      if (createdView) {
        setViewType(createdView.type as GroveSurfaceView);
        setIsViewMenuOpen(false);
      }
    } finally {
      setIsCreatingView(false);
    }
  };

  const handleTogglePropertyVisibility = async (propertyId: string) => {
    if (!selectedView || !onUpdateView) {
      return;
    }

    const nextVisibleProperties = visiblePropertyIds.includes(propertyId)
      ? visiblePropertyIds.filter((id) => id !== propertyId)
      : [...visiblePropertyIds, propertyId];

    if (nextVisibleProperties.length === 0) {
      return;
    }

    await onUpdateView(selectedView.id, {
      config: {
        ...selectedViewConfig,
        visibleProperties: nextVisibleProperties,
      },
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {availableViewItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === viewType;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewType(item.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition ${
                    isActive
                      ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
            <span className="ml-2 shrink-0 text-[12px] text-[var(--color-text-secondary)]">
              {rowCountLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-[12rem] items-center gap-2 rounded-md bg-[var(--color-surface)] px-2.5 py-1.5 text-[13px] text-[var(--color-text-secondary)]">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <input
                name="grove-database-search"
                type="text"
                value={queryState.globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
              />
            </label>
            <button
              type="button"
              onClick={() => setIsQueryPanelOpen((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition ${
                isQueryPanelOpen
                  ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {isQueryPanelOpen ? (
                <SlidersHorizontal className="h-4 w-4" />
              ) : (
                <ListFilter className="h-4 w-4" />
              )}
              Filter
            </button>
            {selectedView ? (
              <div className="relative" ref={columnMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnMenuOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                >
                  Columns
                </button>
                {isColumnMenuOpen ? (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-52 rounded-md bg-[var(--color-background)] py-1 shadow-lg ring-1 ring-[var(--color-border)]">
                    {properties.map((property) => {
                      const isVisible = visiblePropertyIds.includes(property.id);
                      return (
                        <button
                          key={property.id}
                          type="button"
                          onClick={() => void handleTogglePropertyVisibility(property.id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)]"
                        >
                          <span className="truncate">{property.name}</span>
                          {isVisible ? <Check className="h-4 w-4" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
            {onCreateView && missingViewItems.length > 0 ? (
              <div className="relative" ref={viewMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsViewMenuOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <Plus className="h-4 w-4" />
                  View
                </button>
                {isViewMenuOpen ? (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-md bg-[var(--color-background)] py-1 shadow-lg ring-1 ring-[var(--color-border)]">
                    {missingViewItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void handleCreateView(item.id)}
                          disabled={isCreatingView}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:text-[var(--color-text-placeholder)]"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {isQueryPanelOpen ? (
          <div className="pt-3">
            <DatabaseQueryPanel
              globalFilter={queryState.globalFilter}
              activeFilterColumnId={queryState.activeFilterColumnId ?? null}
              activeFilterValue={activeFilterValue}
              activeSortId={activeSort?.id}
              activeSortDesc={activeSort?.desc ?? false}
              columns={visibleProperties}
              onGlobalFilterChange={setGlobalFilter}
              onFilterColumnChange={setActiveFilterColumn}
              onFilterValueChange={setActiveFilterValue}
              onSortChange={(id, desc) => setSorting(id ? [{ id, desc }] : [])}
              onReset={resetQuery}
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        {viewType === "table" ? (
          <TableView
            pageId={databasePage.id}
            table={table}
            properties={visibleProperties}
            readOnly={readOnly}
            onOpenRow={onOpenRow}
            onCreateRow={onCreateRow}
            onCreateProperty={onCreateProperty}
            onUpdateProperty={onUpdateProperty}
            onDeleteProperty={onDeleteProperty}
            onMoveProperty={onMoveProperty}
            compact={compact}
          />
        ) : null}
        {viewType === "gallery" ? (
          <GalleryView
            table={table}
            properties={visibleProperties}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
          />
        ) : null}
        {viewType === "board" ? (
          <BoardView
            table={table}
            properties={visibleProperties}
            groupByPropertyId={queryState.grouping[0]}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
            onUpdatePropertyValue={onUpdatePropertyValue}
          />
        ) : null}
        {viewType === "calendar" ? (
          <CalendarView
            table={table}
            properties={visibleProperties}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
          />
        ) : null}
      </div>
    </div>
  );
}
