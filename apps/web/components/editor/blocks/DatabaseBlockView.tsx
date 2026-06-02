"use client";

import { useCallback, useRef } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { DatabasePageCard } from "@/components/database/DatabasePageCard";
import { useUIStore } from "@/store/useUIStore";
import { type ViewType } from "@obnofi/types";
import { useDatabaseBlockData, type DatabaseNodeAttrs } from "@/hooks/useDatabaseBlockData";
import { preventInlineBlockDrag } from "@/lib/editor/inlineBlockInteractions";

type GroveSurfaceView = Extract<ViewType, "table" | "gallery" | "board" | "calendar">;

interface GroveSurfaceSnapshot {
  columns: DatabaseNodeAttrs["columns"];
  rows: DatabaseNodeAttrs["rows"];
  filters: DatabaseNodeAttrs["filters"];
  sorts: DatabaseNodeAttrs["sorts"];
}

export { type DatabaseNodeAttrs };

export function DatabaseBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);
  const attrs = props.node.attrs as DatabaseNodeAttrs;
  const { viewType, workspaceId, pageId } = attrs;

  const propsRef = useRef(props);
  const attrsRef = useRef(attrs);
  propsRef.current = props;
  attrsRef.current = attrs;

  const {
    databasePages,
    isCreating,
    selectedValue,
    updateDatabaseBlockAttrs,
    createDatabasePage,
    handleSelectionOpen,
  } = useDatabaseBlockData(attrs, propsRef, attrsRef);

  const handleViewTypeChange = useCallback(
    (nextViewType: GroveSurfaceView) => {
      if (attrsRef.current.viewType === nextViewType) return;
      updateDatabaseBlockAttrs({ viewType: nextViewType });
    },
    [updateDatabaseBlockAttrs]
  );

  const handleSurfaceStateChange = useCallback(
    (snapshot: GroveSurfaceSnapshot) => {
      const currentAttrs = attrsRef.current;
      const next = { columns: snapshot.columns, rows: snapshot.rows, filters: snapshot.filters, sorts: snapshot.sorts };
      if (
        JSON.stringify(currentAttrs.columns) === JSON.stringify(next.columns) &&
        JSON.stringify(currentAttrs.rows) === JSON.stringify(next.rows) &&
        JSON.stringify(currentAttrs.filters) === JSON.stringify(next.filters) &&
        JSON.stringify(currentAttrs.sorts) === JSON.stringify(next.sorts)
      ) return;
      updateDatabaseBlockAttrs(next);
    },
    [updateDatabaseBlockAttrs]
  );

  return (
    <NodeViewWrapper
      className="my-4"
      contentEditable={false}
      data-inline-block="true"
      onDragStart={preventInlineBlockDrag}
    >
      <DatabasePageCard
        pageId={pageId}
        containerTestId="inline-database-embed"
        loadingTestId="inline-database-loading"
        readyTestId="inline-database-ready"
        emptyTestId="inline-database-empty"
        onOpenRow={(rowId) => openGrovePageSideTab(rowId, workspaceId)}
        selection={
          props.editor.isEditable
            ? {
                pages: databasePages,
                selectedValue,
                onChange: (nextPageId) => {
                  const nextPage = databasePages.find((c) => c.id === nextPageId);
                  updateDatabaseBlockAttrs({
                    pageId: nextPage?.id ?? null,
                    databaseId: nextPage?.databaseId ?? null,
                    autoCreate: false,
                  });
                },
                onCreate: () => { void createDatabasePage(); },
                onOpen: handleSelectionOpen,
              }
            : undefined
        }
        onOpenDatabase={
          workspaceId && pageId
            ? () => router.push(`/workspace/${workspaceId}?page=${pageId}`)
            : undefined
        }
        compact={false}
        editableTitle={props.editor.isEditable}
        viewType={viewType}
        onViewTypeChange={handleViewTypeChange}
        onSurfaceStateChange={handleSurfaceStateChange}
        maxContentHeightClass="max-h-[720px]"
        emptyMessage={
          isCreating
            ? "Creating Grove Catalog..."
            : props.editor.isEditable
            ? "Grove Catalog is being prepared."
            : "Database preview unavailable."
        }
        state={pageId ? undefined : isCreating ? "creating" : "empty"}
      />
    </NodeViewWrapper>
  );
}
