"use client";

import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CanvasBlockView } from "@/components/editor/blocks/CanvasBlockView";
import { shouldStopInlineBlockEvent } from "@/lib/editor/inlineBlockInteractions";

interface CanvasBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

export const CanvasBlock = Node.create<CanvasBlockExtensionOptions>({
  name: "canvasEmbed",
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
      pageId: {
        default: null,
      },
      workspaceId: {
        default: null,
      },
      parentPageId: {
        default: null,
      },
      autoCreate: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='canvas-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "canvas-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CanvasBlockView, {
      stopEvent: ({ event }) => shouldStopInlineBlockEvent(event),
    });
  },

  addCommands() {
    return {
      insertCanvasEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                pageId: null,
                workspaceId: this.options.workspaceId ?? null,
                parentPageId: this.options.pageId ?? null,
                autoCreate: true,
              },
            },
            { type: "paragraph" },
          ]),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/canvas$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;

          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent([
              {
                type: this.name,
                attrs: {
                  pageId: null,
                  workspaceId: this.options.workspaceId ?? null,
                  parentPageId: this.options.pageId ?? null,
                  autoCreate: true,
                },
              },
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
    canvasEmbed: {
      insertCanvasEmbed: () => ReturnType;
    };
  }
}
