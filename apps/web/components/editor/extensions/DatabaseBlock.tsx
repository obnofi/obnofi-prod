"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useRouter } from "next/navigation";
import { DatabasePageCard } from "@/components/database/DatabasePageCard";
import { useUIStore } from "@/store/useUIStore";
import { Page, PropertyType, ViewType } from "@obnofi/types";
import { InlineBlockShell } from "@/components/editor/InlineBlockShell";

interface DatabaseBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

type GroveSurfaceView = Extract<ViewType, "table" | "gallery" | "board" | "calendar">;

interface DatabaseNodeAttrs {
  databaseId: string | null;
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
  viewType: GroveSurfaceView;
  columns: Array<{ id: string; name: string; type: PropertyType; width?: number }>;
  rows: string[];
  filters: Array<{ id: string; value: unknown }>;
  sorts: Array<{ id: string; desc: boolean }>;
}

interface GroveSurfaceSnapshot {
  columns: DatabaseNodeAttrs["columns"];
  rows: DatabaseNodeAttrs["rows"];
  filters: DatabaseNodeAttrs["filters"];
  sorts: DatabaseNodeAttrs["sorts"];
}

function createDatabaseBlockAttrs(options: DatabaseBlockExtensionOptions) {
  return {
    databaseId: null,
    pageId: null,
    workspaceId: options.workspaceId ?? null,
    parentPageId: options.pageId ?? null,
    autoCreate: true,
    viewType: "table",
    columns: [],
    rows: [],
    filters: [],
    sorts: [],
  };
}

function DatabaseBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);
  const attrs = props.node.attrs as DatabaseNodeAttrs;
  const {
    databaseId,
    pageId,
    workspaceId,
    parentPageId,
    autoCreate,
    viewType,
  } = attrs;
  const [databasePages, setDatabasePages] = useState<Page[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const attrsRef = useRef(attrs);
  const propsRef = useRef(props);

  attrsRef.current = attrs;
  propsRef.current = props;

  const updateDatabaseBlockAttrs = useCallback(
    (nextAttrs: Partial<DatabaseNodeAttrs>) => {
      const currentProps = propsRef.current;

      if (
        !currentProps.editor.isEditable ||
        currentProps.editor.isDestroyed
      ) {
        return;
      }

      const position = currentProps.getPos();
      if (typeof position !== "number") {
        return;
      }

      const currentNode = currentProps.editor.state.doc.nodeAt(position);
      if (currentNode?.type.name !== currentProps.node.type.name) {
        return;
      }

      try {
        currentProps.updateAttributes(nextAttrs);
      } catch (error) {
        if (
          error instanceof RangeError &&
          error.message.includes("No node at given position")
        ) {
          return;
        }

        throw error;
      }
    },
    []
  );

  const handleViewTypeChange = useCallback(
    (nextViewType: GroveSurfaceView) => {
      if (attrsRef.current.viewType === nextViewType) {
        return;
      }

      updateDatabaseBlockAttrs({ viewType: nextViewType });
    },
    [updateDatabaseBlockAttrs]
  );

  const handleSurfaceStateChange = useCallback(
    (snapshot: GroveSurfaceSnapshot) => {
      const currentAttrs = attrsRef.current;
      const nextSnapshot = {
        columns: snapshot.columns,
        rows: snapshot.rows,
        filters: snapshot.filters,
        sorts: snapshot.sorts,
      };

      if (
        JSON.stringify(currentAttrs.columns) ===
          JSON.stringify(nextSnapshot.columns) &&
        JSON.stringify(currentAttrs.rows) === JSON.stringify(nextSnapshot.rows) &&
        JSON.stringify(currentAttrs.filters) ===
          JSON.stringify(nextSnapshot.filters) &&
        JSON.stringify(currentAttrs.sorts) === JSON.stringify(nextSnapshot.sorts)
      ) {
        return;
      }

      updateDatabaseBlockAttrs(nextSnapshot);
    },
    [updateDatabaseBlockAttrs]
  );

  const hasLoadedPages = useRef(false);

  const loadDatabasePages = useCallback(async () => {
    if (!workspaceId || hasLoadedPages.current) {
      return;
    }

    hasLoadedPages.current = true;
    const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
    if (!response.ok) {
      hasLoadedPages.current = false;
      return;
    }

    const pages = (await response.json()) as Page[];
    setDatabasePages(pages.filter((page) => page.type === "database"));
  }, [workspaceId]);

  // 선택 UI가 필요할 때만 로드 (처음 selection이 필요해질 때)
  const [shouldLoadPages, setShouldLoadPages] = useState(false);
  
  useEffect(() => {
    if (shouldLoadPages && !hasLoadedPages.current) {
      void loadDatabasePages();
    }
  }, [shouldLoadPages, loadDatabasePages]);

  // selection prop이 있고 아직 로드되지 않았으면 로드 트리거
  const handleSelectionOpen = useCallback(() => {
    setShouldLoadPages(true);
  }, []);

  const createDatabasePage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreatingRef.current) {
      return;
    }

    isCreatingRef.current = true;
    setIsCreating(true);
    const response = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Grove Catalog",
        type: "database",
        parentId: parentPageId,
        workspaceId,
      }),
    });

    isCreatingRef.current = false;
    setIsCreating(false);

    if (!response.ok) {
      return;
    }

    const createdPage = (await response.json()) as Page;
    updateDatabaseBlockAttrs({
      pageId: createdPage.id,
      databaseId: createdPage.databaseId ?? null,
      autoCreate: false,
    });
    await loadDatabasePages();
  }, [loadDatabasePages, parentPageId, updateDatabaseBlockAttrs, workspaceId]);

  useEffect(() => {
    if (!props.editor.isEditable || !autoCreate || pageId) {
      return;
    }

    void createDatabasePage();
  }, [autoCreate, createDatabasePage, pageId, props.editor.isEditable]);

  const selectedValue = useMemo(() => {
    if (pageId) {
      return pageId;
    }

    if (databaseId) {
      return (
        databasePages.find((candidate) => candidate.databaseId === databaseId)?.id ?? ""
      );
    }

    return "";
  }, [databaseId, databasePages, pageId]);

  return (
    <NodeViewWrapper
      className="my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <InlineBlockShell activationHint="더블클릭하여 데이터베이스 편집">
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
                    const nextPage = databasePages.find(
                      (candidate) => candidate.id === nextPageId
                    );

                    updateDatabaseBlockAttrs({
                      pageId: nextPage?.id ?? null,
                      databaseId: nextPage?.databaseId ?? null,
                      autoCreate: false,
                    });
                  },
                  onCreate: () => {
                    void createDatabasePage();
                  },
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
      </InlineBlockShell>
    </NodeViewWrapper>
  );
}

export const DatabaseBlock = Node.create<DatabaseBlockExtensionOptions>({
  name: "databaseNode",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      workspaceId: undefined,
      pageId: undefined,
    };
  },

  addAttributes() {
    return {
      databaseId: { default: null },
      pageId: { default: null },
      workspaceId: { default: null },
      parentPageId: { default: null },
      autoCreate: { default: false },
      viewType: { default: "table" },
      columns: { default: [] },
      rows: { default: [] },
      filters: { default: [] },
      sorts: { default: [] },
    };
  },

  parseHTML() {
    return [
      { tag: "div[data-type='database-node']" },
      { tag: "div[data-type='database-embed']" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "database-node" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseBlockView);
  },

  addCommands() {
    return {
      insertDatabaseNode:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: createDatabaseBlockAttrs(this.options),
          }) && commands.createParagraphNear(),
      insertDatabaseEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: createDatabaseBlockAttrs(this.options),
          }) && commands.createParagraphNear(),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/database$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: createDatabaseBlockAttrs(this.options),
            })
            .createParagraphNear()
            .run();
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    databaseNode: {
      insertDatabaseNode: () => ReturnType;
      insertDatabaseEmbed: () => ReturnType;
    };
  }
}
