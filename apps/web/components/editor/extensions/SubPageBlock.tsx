"use client";

import { useCallback } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { FileText, PenTool, Database } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { usePageStore } from "@/store/pageStore";

interface SubPageBlockAttrs {
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
}

const TYPE_ICONS = {
  document: FileText,
  canvas: PenTool,
  database: Database,
};

function SubPageBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as SubPageBlockAttrs;
  const { pageId, workspaceId } = attrs;

  const page = usePageStore((s) => s.pages.find((p) => p.id === pageId));
  const { openGrovePageSideTab } = useUIStore();

  const handleOpen = useCallback(() => {
    if (!pageId || !workspaceId) return;
    openGrovePageSideTab(pageId, workspaceId);
  }, [pageId, workspaceId, openGrovePageSideTab]);

  const type = page?.type ?? "document";
  const TypeIcon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] ?? FileText;

  if (!page) {
    return (
      <NodeViewWrapper contentEditable={false}>
        <span className="inline-flex items-center gap-1.5 text-zinc-400 line-through">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          삭제된 페이지
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper contentEditable={false}>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded px-0.5 text-[#111110] transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="shrink-0 leading-none">
          {page.icon ? (
            <span className="text-sm">{page.icon}</span>
          ) : (
            <TypeIcon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          )}
        </span>
        <span className="text-sm underline decoration-zinc-300 underline-offset-2 dark:decoration-zinc-600">
          {page.title || "제목 없음"}
        </span>
      </button>
    </NodeViewWrapper>
  );
}

export const SubPageBlock = Node.create({
  name: "subPageEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      pageId: { default: null },
      workspaceId: { default: null },
      parentPageId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='subpage-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "subpage-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SubPageBlockView);
  },

  addCommands() {
    return {
      insertSubPageEmbed:
        (attrs: {
          pageId: string;
          workspaceId: string;
          parentPageId: string;
        }) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    subPageEmbed: {
      insertSubPageEmbed: (attrs: {
        pageId: string;
        workspaceId: string;
        parentPageId: string;
      }) => ReturnType;
    };
  }
}
