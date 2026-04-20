"use client";

import { DatabasePage, PropertyType, ViewType } from "@/types";
import { DatabaseSurface } from "@/components/database/DatabaseSurface";

interface ViewTabsProps {
  databasePage: DatabasePage;
  onDatabaseChange: (databasePage: DatabasePage) => void;
  onOpenRow?: (rowId: string) => void;
  onCreateRow?: () => void;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  compact?: boolean;
}

export function ViewTabs({
  databasePage,
  onDatabaseChange,
  onOpenRow,
  onCreateRow,
  onCreateProperty,
  compact = true,
}: ViewTabsProps) {
  return (
    <DatabaseSurface
      databasePage={databasePage}
      initialViewType={"table" as Extract<ViewType, "table" | "gallery" | "board" | "calendar">}
      onOpenRow={onOpenRow}
      onCreateRow={onCreateRow}
      onCreateProperty={onCreateProperty}
      compact={compact}
    />
  );
}
