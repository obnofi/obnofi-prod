"use client";

import type { Page, PropertyType, ViewType } from "@obnofi/types";
import { DatabaseTableCard } from "@/components/database/DatabaseTableCard";
import { useDatabasePage } from "@/hooks/useDatabasePage";

interface DatabaseSelectionProps {
  pages: Page[];
  selectedValue: string;
  onChange: (pageId: string) => void;
  onCreate?: () => void;
  onOpen?: () => void;
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
  jungleLimit?: number;
  maxContentHeightClass?: string;
  state?: "loading" | "ready" | "creating" | "empty";
  editableTitle?: boolean;
  // 공개 뷰 등 읽기 전용. 모든 변형 콜백을 차단해 익명 사용자가 no-auth API로 DB를 수정하지 못하게 한다.
  readOnly?: boolean;
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
  jungleLimit,
  maxContentHeightClass,
  state,
  editableTitle = false,
  readOnly = false,
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
    createView,
    updateView,
    updateProperty,
    deleteProperty,
    updatePropertyValue,
  } = useDatabasePage(pageId, { jungleLimit });

  return (
    <DatabaseTableCard
      containerTestId={containerTestId}
      loadingTestId={loadingTestId}
      readyTestId={readyTestId}
      emptyTestId={emptyTestId}
      databasePage={databasePage}
      isLoading={isLoading}
      readOnly={readOnly}
      onDatabaseChange={setDatabasePage}
      onOpenRow={onOpenRow}
      onCreateRow={readOnly ? undefined : createRow}
      onCreateProperty={readOnly ? undefined : (name, type) => createProperty({ name, type })}
      onCreateView={readOnly ? undefined : createView}
      onUpdateView={readOnly ? undefined : updateView}
      onUpdateProperty={readOnly ? undefined : updateProperty}
      onDeleteProperty={readOnly ? undefined : deleteProperty}
      onUpdatePropertyValue={readOnly ? undefined : updatePropertyValue}
      onTitleChange={editableTitle && !readOnly ? updateDatabaseTitle : undefined}
      viewType={viewType}
      onViewTypeChange={onViewTypeChange}
      onSurfaceStateChange={readOnly ? undefined : onSurfaceStateChange}
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
