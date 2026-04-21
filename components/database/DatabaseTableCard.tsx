"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Plus } from "lucide-react";
import type {
  DatabasePage,
  PropertyType,
  Page,
  PropertyValueData,
  ViewType,
} from "@/types";
import { DatabaseSurface } from "@/components/database/DatabaseSurface";

interface DatabaseSelectionProps {
  pages: Page[];
  selectedValue: string;
  onChange: (pageId: string) => void;
  onCreate?: () => void;
}

interface DatabaseTableCardProps {
  databasePage: DatabasePage | null;
  isLoading: boolean;
  onDatabaseChange: (databasePage: DatabasePage) => void;
  onOpenRow: (rowId: string) => void;
  onCreateRow?: () => void | Promise<string | undefined>;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  onUpdatePropertyValue?: (
    rowId: string,
    propertyId: string,
    value: PropertyValueData
  ) => void;
  onTitleChange?: (title: string) => void | Promise<void>;
  viewType?: Extract<ViewType, "table" | "gallery" | "board" | "calendar">;
  onViewTypeChange?: (
    viewType: Extract<ViewType, "table" | "gallery" | "board" | "calendar">
  ) => void;
  onSurfaceStateChange?: (snapshot: {
    columns: Array<{ id: string; name: string; type: PropertyType; width?: number }>;
    rows: string[];
    filters: Array<{ id: string; value: unknown }>;
    sorts: Array<{ id: string; desc: boolean }>;
  }) => void;
  selection?: DatabaseSelectionProps;
  headerLabel?: string;
  onOpenDatabase?: () => void;
  emptyMessage: string;
  loadingTestId: string;
  readyTestId: string;
  emptyTestId: string;
  containerTestId: string;
  compact?: boolean;
  maxContentHeightClass?: string;
  state?: "loading" | "ready" | "creating" | "empty";
}

export function DatabaseTableCard({
  databasePage,
  isLoading,
  onDatabaseChange,
  onOpenRow,
  onCreateRow,
  onCreateProperty,
  onUpdatePropertyValue,
  onTitleChange,
  viewType,
  onViewTypeChange,
  onSurfaceStateChange,
  selection,
  headerLabel,
  onOpenDatabase,
  emptyMessage,
  loadingTestId,
  readyTestId,
  emptyTestId,
  containerTestId,
  compact = true,
  maxContentHeightClass = "max-h-[380px]",
  state,
}: DatabaseTableCardProps) {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const selectionMenuRef = useRef<HTMLDivElement>(null);
  const showTopBar = Boolean(selection || headerLabel || onOpenDatabase);
  const currentState =
    state ?? (!databasePage && isLoading ? "loading" : databasePage ? "ready" : "empty");

  useEffect(() => {
    if (!isSelectionOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectionMenuRef.current &&
        !selectionMenuRef.current.contains(event.target as Node)
      ) {
        setIsSelectionOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelectionOpen]);

  const selectedPage = selection?.pages.find(
    (page) => page.id === selection.selectedValue
  );

  return (
    <div
      data-testid={containerTestId}
      data-state={currentState}
      className="overflow-hidden not-prose bg-[var(--color-background)]"
    >
      {showTopBar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            {headerLabel ? (
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                {headerLabel}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {selection ? (
              <div className="relative" ref={selectionMenuRef}>
                <button
                  type="button"
                  data-testid="inline-database-select"
                  onClick={() => setIsSelectionOpen((current) => !current)}
                  className="inline-flex min-w-48 items-center justify-between gap-2 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition hover:bg-[var(--color-hover)]"
                >
                  <span className="truncate">
                    {selectedPage?.title ?? "데이터베이스 선택"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
                </button>

                {isSelectionOpen ? (
                  <div className="absolute right-0 top-full z-[99999] mt-1 min-w-56 rounded border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        selection.onCreate?.();
                        setIsSelectionOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)]"
                    >
                      <Plus className="h-4 w-4" />
                      데이터베이스 추가
                    </button>
                    <div className="my-1 border-t border-[var(--color-border)]" />
                    {selection.pages.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => {
                          selection.onChange(page.id);
                          setIsSelectionOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)]"
                      >
                        <span className="truncate">{page.title}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {onOpenDatabase ? (
              <button
                type="button"
                onClick={onOpenDatabase}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div data-testid={loadingTestId} className="flex h-56 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        </div>
      ) : databasePage ? (
        <div data-testid={readyTestId} className={`flex min-h-0 flex-col ${maxContentHeightClass}`}>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="min-w-0">
              {onTitleChange ? (
                <input
                  type="text"
                  value={databasePage.title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className="w-full border-none bg-transparent text-[40px] font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                  placeholder="Untitled"
                />
              ) : (
                <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                  {databasePage.icon ? `${databasePage.icon} ` : ""}
                  {databasePage.title}
                </div>
              )}
              <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {databasePage.database?.rows?.length ?? 0} rows, {databasePage.database?.columns?.length ?? 0} columns
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <DatabaseSurface
              databasePage={databasePage}
              initialViewType={viewType}
              onViewTypeChange={onViewTypeChange}
              onSurfaceStateChange={onSurfaceStateChange}
              onOpenRow={onOpenRow}
              onCreateRow={onCreateRow}
              onCreateProperty={onCreateProperty}
              onUpdatePropertyValue={onUpdatePropertyValue}
              compact={compact}
            />
          </div>
        </div>
      ) : (
        <div data-testid={emptyTestId} className="px-4 py-8 text-sm text-[var(--color-text-secondary)]">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
