"use client";

import type { MouseEvent } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink } from "lucide-react";

interface ButtonBlockAttrs {
  label: string;
  url: string;
  variant: "primary" | "secondary";
}

function ButtonBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as ButtonBlockAttrs;
  const { label, url, variant } = attrs;
  const isEditable = props.editor.isEditable;
  const stopEditorSelection = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const buttonClassName =
    variant === "secondary"
      ? "border border-[var(--color-border)] bg-[var(--color-surface)] text-white hover:bg-[var(--color-hover)]"
      : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]";

  return (
    <NodeViewWrapper
      className="my-2"
      data-testid="button-block"
      contentEditable={false}
      onMouseDown={stopEditorSelection}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="not-prose flex flex-col gap-2">
        <button
          type="button"
          data-testid="button-block-preview"
          onMouseDown={stopEditorSelection}
          onClick={() => {
            if (isEditable || !url) return;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${buttonClassName}`}
        >
          <span>{label || "Button"}</span>
          {url ? <ExternalLink className="h-3.5 w-3.5" /> : null}
        </button>
        {isEditable ? (
          <div className="flex flex-col gap-1.5" onMouseDown={stopEditorSelection}>
            <input
              type="text"
              data-testid="button-block-label"
              value={label}
              placeholder="Button label"
              onChange={(e) => props.updateAttributes({ label: e.target.value })}
              className="w-full max-w-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            />
            <input
              type="url"
              data-testid="button-block-url"
              value={url}
              placeholder="https://..."
              onChange={(e) => props.updateAttributes({ url: e.target.value })}
              className="w-full max-w-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const ButtonBlock = Node.create({
  name: "buttonBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: "Button",
      },
      url: {
        default: "",
      },
      variant: {
        default: "primary",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='button-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "button-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonBlockView);
  },

  addCommands() {
    return {
      insertButtonBlock:
        (attrs?: { label?: string; url?: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              label: attrs?.label ?? "Button",
              url: attrs?.url ?? "",
              variant: "primary",
            },
          }),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/button$/,
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
                label: "Button",
                url: "",
                variant: "primary",
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
    buttonBlock: {
      insertButtonBlock: (attrs?: { label?: string; url?: string }) => ReturnType;
    };
  }
}
