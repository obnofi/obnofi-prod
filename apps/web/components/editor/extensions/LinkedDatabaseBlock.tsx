"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useUIStore } from "@/store/useUIStore";

const DatabasePageCard = dynamic(() => import("@/components/database/DatabasePageCard").then(mod => mod.DatabasePageCard), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading database...</div> });

interface LinkedDatabaseBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

interface LinkedDatabaseBlockAttrs {
  databaseId: string | null;
  pageId: string | null;
  workspaceId: string | null;
}

function LinkedDatabaseBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);
  const attrs = props.node.attrs as LinkedDatabaseBlockAttrs;
  const { pageId, workspaceId } = attrs;

  return (
    <NodeViewWrapper
      className="my-4"
      contentEditable={false}
      data-inline-block="true"
    >
      <DatabasePageCard
        pageId={pageId}
        containerTestId="linked-database-embed"
        loadingTestId="linked-database-loading"
        readyTestId="linked-database-ready"
        emptyTestId="linked-database-empty"
        onOpenRow={(rowId) => openGrovePageSideTab(rowId, workspaceId)}
        headerLabel="연결된 데이터베이스"
        onOpenDatabase={
          workspaceId && pageId
            ? () => router.push(`/workspace/${workspaceId}?page=${pageId}`)
            : undefined
        }
        compact={false}
        maxContentHeightClass="max-h-[720px]"
        emptyMessage="데이터베이스를 불러올 수 없습니다."
      />
    </NodeViewWrapper>
  );
}

export const LinkedDatabaseBlock = Node.create<LinkedDatabaseBlockExtensionOptions>({
  name: "linkedDatabaseEmbed",
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
      databaseId: {
        default: null,
      },
      pageId: {
        default: null,
      },
      workspaceId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='linked-database-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "linked-database-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkedDatabaseBlockView, {
      stopEvent: ({ event }) => {
        if (event.type === "mousedown") return true;
        const target = event.target as HTMLElement;
        return (
          ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target?.tagName ?? "") ||
          Boolean(target?.isContentEditable)
        );
      },
    });
  },

  addCommands() {
    return {
      insertLinkedDatabaseEmbed:
        (attrs?: { databaseId?: string; pageId?: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              databaseId: attrs?.databaseId ?? null,
              pageId: attrs?.pageId ?? null,
              workspaceId: this.options.workspaceId ?? null,
            },
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkedDatabaseEmbed: {
      insertLinkedDatabaseEmbed: (attrs?: { databaseId?: string; pageId?: string }) => ReturnType;
    };
  }
}
