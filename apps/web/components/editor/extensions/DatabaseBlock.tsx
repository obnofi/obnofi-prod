"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useUIStore } from "@/store/useUIStore";
import { Page, PropertyType, ViewType } from "@obnofi/types";

const DatabasePageCard = dynamic(() => import("@/components/database/DatabasePageCard").then(mod => mod.DatabasePageCard), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading database...</div> });

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

  const loadDatabasePages = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
    if (!response.ok) {
      return;
    }

    const pages = (await response.json()) as Page[];
    setDatabasePages(pages.filter((page) => page.type === "database"));
  }, [workspaceId]);

  useEffect(() => {
    void loadDatabasePages();
  }, [loadDatabasePages]);

  const createDatabasePage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreating) {
      return;
    }

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

    setIsCreating(false);

    if (!response.ok) {
      return;
    }

    const createdPage = (await response.json()) as Page;
    props.updateAttributes({
      pageId: createdPage.id,
      databaseId: createdPage.databaseId ?? null,
      autoCreate: false,
    });
    await loadDatabasePages();
  }, [isCreating, loadDatabasePages, parentPageId, props, workspaceId]);

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
    <NodeViewWrapper className="my-4">
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

                  props.updateAttributes({
                    pageId: nextPage?.id ?? null,
                    databaseId: nextPage?.databaseId ?? null,
                    autoCreate: false,
                  });
                },
                onCreate: () => {
                  void createDatabasePage();
                },
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
        onViewTypeChange={(nextViewType) =>
          props.updateAttributes({ viewType: nextViewType })
        }
        onSurfaceStateChange={(snapshot) =>
          props.updateAttributes({
            columns: snapshot.columns,
            rows: snapshot.rows,
            filters: snapshot.filters,
            sorts: snapshot.sorts,
          })
        }
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
            attrs: {
              databaseId: null,
              pageId: null,
              workspaceId: this.options.workspaceId ?? null,
              parentPageId: this.options.pageId ?? null,
              autoCreate: true,
              viewType: "table",
              columns: [],
              rows: [],
              filters: [],
              sorts: [],
            },
          }),
      insertDatabaseEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              databaseId: null,
              pageId: null,
              workspaceId: this.options.workspaceId ?? null,
              parentPageId: this.options.pageId ?? null,
              autoCreate: true,
              viewType: "table",
              columns: [],
              rows: [],
              filters: [],
              sorts: [],
            },
          }),
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
              attrs: {
                databaseId: null,
                pageId: null,
                workspaceId: this.options.workspaceId ?? null,
                parentPageId: this.options.pageId ?? null,
                autoCreate: true,
                viewType: "table",
                columns: [],
                rows: [],
                filters: [],
                sorts: [],
              },
            })
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
