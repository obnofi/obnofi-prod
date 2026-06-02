"use client";

import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DatabaseBlockView } from "@/components/editor/blocks/DatabaseBlockView";
import { PropertyType, ViewType } from "@obnofi/types";
import { shouldStopInlineBlockEvent } from "@/lib/editor/inlineBlockInteractions";

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

function createDatabaseBlockAttrs(options: DatabaseBlockExtensionOptions): DatabaseNodeAttrs {
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

export const DatabaseBlock = Node.create<DatabaseBlockExtensionOptions>({
  name: "databaseNode",
  group: "block",
  atom: true,
  selectable: false,
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
    return ReactNodeViewRenderer(DatabaseBlockView, {
      stopEvent: ({ event }) => shouldStopInlineBlockEvent(event),
    });
  },

  addCommands() {
    return {
      insertDatabaseNode:
        () =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: createDatabaseBlockAttrs(this.options) },
            { type: "paragraph" },
          ]),
      insertDatabaseEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: createDatabaseBlockAttrs(this.options) },
            { type: "paragraph" },
          ]),
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
            .insertContent([
              { type: this.name, attrs: createDatabaseBlockAttrs(this.options) },
              { type: "paragraph" },
            ])
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
