"use client";

import type { Page, PropertyType, ViewType } from "@obnofi/types";
import { DatabaseTableCard } from "@/components/database/DatabaseTableCard";
import { useDatabasePage } from "@/hooks/useDatabasePage";

interface DatabaseSelectionProps {
  pages: Page[];
  selectedValue: string;
  onChange: (pageId: string) => void;
  onCreate?: () => void;
}

interface DatabasePageCardProps {
  pageId: string | null | undefined;
  onOpenRow: (rowId: string) => void;
  onOpenDatabase?: () => void;
  selection?: DatabaseSelectionProps;
  headerLabel?: string;
  emptyMessage: string;
  loadingTestId: string;
  readyTestId: string;
  emptyTestId: string;
  containerTestId: string;
  compact?: boolean;
  maxContentHeightClass?: string;
  state?: "loading" | "ready" | "creating" | "empty";
  editableTitle?: boolean;
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
}

export function DatabasePageCard({
  pageId,
  onOpenRow,
  onOpenDatabase,
  selection,
  headerLabel,
  emptyMessage,
  loadingTestId,
  readyTestId,
  emptyTestId,
  containerTestId,
  compact = true,
  maxContentHeightClass,
  state,
  editableTitle = false,
  viewType,
  onViewTypeChange,
  onSurfaceStateChange,
}: DatabasePageCardProps) {
  const {
    databasePage,
    isLoading,
    setDatabasePage,
    updateDatabaseTitle,
    createRow,
    createProperty,
    updateProperty,
    deleteProperty,
    updatePropertyValue,
  } = useDatabasePage(pageId);

  return (
    <DatabaseTableCard
      containerTestId={containerTestId}
      loadingTestId={loadingTestId}
      readyTestId={readyTestId}
      emptyTestId={emptyTestId}
      databasePage={databasePage}
      isLoading={isLoading}
      onDatabaseChange={setDatabasePage}
      onOpenRow={onOpenRow}
      onCreateRow={createRow}
      onCreateProperty={(name, type) => createProperty({ name, type })}
      onUpdateProperty={updateProperty}
      onDeleteProperty={deleteProperty}
      onMoveProperty={(propertyId, direction) => {
        // TODO: Implement property reordering
        console.log("Move property", propertyId, direction);
      }}
      onUpdatePropertyValue={updatePropertyValue}
      onTitleChange={editableTitle ? updateDatabaseTitle : undefined}
      viewType={viewType}
      onViewTypeChange={onViewTypeChange}
      onSurfaceStateChange={onSurfaceStateChange}
      selection={selection}
      headerLabel={headerLabel}
      onOpenDatabase={onOpenDatabase}
      emptyMessage={emptyMessage}
      compact={compact}
      maxContentHeightClass={maxContentHeightClass}
      state={state}
    />
  );
}
