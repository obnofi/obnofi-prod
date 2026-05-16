"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Loader2, Layout, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Page } from "@obnofi/types";
import { InlineBlockShell } from "@/components/editor/InlineBlockShell";

const ClearingBoard = dynamic(() => import("@/components/canvas/ClearingBoard").then(mod => mod.ClearingBoard), { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" /></div> });

interface CanvasBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

interface CanvasBlockAttrs {
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
}

function CanvasBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const attrs = props.node.attrs as CanvasBlockAttrs;
  const { pageId, workspaceId, parentPageId, autoCreate } = attrs;
  const [canvasPage, setCanvasPage] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => autoCreate || Boolean(pageId));

  const hasLoaded = useRef(false);
  const isCreatingRef = useRef(false);
  const propsRef = useRef(props);

  propsRef.current = props;

  const updateCanvasBlockAttrs = useCallback(
    (nextAttrs: Partial<CanvasBlockAttrs>) => {
      const currentProps = propsRef.current;

      if (
        !currentProps.editor.isEditable ||
        currentProps.editor.isDestroyed
      ) {
        return false;
      }

      const position = currentProps.getPos();
      if (typeof position !== "number") {
        return false;
      }

      const currentNode = currentProps.editor.state.doc.nodeAt(position);
      if (currentNode?.type.name !== currentProps.node.type.name) {
        return false;
      }

      try {
        currentProps.updateAttributes(nextAttrs);
        return true;
      } catch (error) {
        if (
          error instanceof RangeError &&
          error.message.includes("No node at given position")
        ) {
          return false;
        }

        throw error;
      }
    },
    []
  );

  const loadCanvasPage = useCallback(async () => {
    if (!pageId || hasLoaded.current) {
      if (!pageId) setCanvasPage(null);
      return;
    }

    hasLoaded.current = true;
    setIsLoading(true);
    const response = await fetch(`/api/pages/${pageId}`);
    if (!response.ok) {
      setCanvasPage(null);
      hasLoaded.current = false;
      setIsLoading(false);
      return;
    }

    const page = (await response.json()) as Page;
    setCanvasPage(page);
    setIsLoading(false);
  }, [pageId]);

  const createCanvasPage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreatingRef.current) {
      return;
    }

    isCreatingRef.current = true;
    setIsCreating(true);
    updateCanvasBlockAttrs({ autoCreate: false });

    const response = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Inline Clearing",
        type: "canvas",
        parentId: parentPageId,
        workspaceId,
      }),
    });

    isCreatingRef.current = false;
    setIsCreating(false);

    if (!response.ok) {
      updateCanvasBlockAttrs({ autoCreate: true });
      return;
    }

    const createdPage = (await response.json()) as Page;
    hasLoaded.current = true;
    setCanvasPage(createdPage);
    setIsExpanded(true);
    updateCanvasBlockAttrs({
      pageId: createdPage.id,
      autoCreate: false,
    });
  }, [parentPageId, updateCanvasBlockAttrs, workspaceId]);

  useEffect(() => {
    if (!props.editor.isEditable || !autoCreate || pageId) {
      return;
    }

    void createCanvasPage();
  }, [autoCreate, createCanvasPage, pageId, props.editor.isEditable]);

  useEffect(() => {
    if (!isExpanded || !pageId || hasLoaded.current) {
      return;
    }

    void loadCanvasPage();
  }, [isExpanded, loadCanvasPage, pageId]);

  useEffect(() => {
    if (pageId || autoCreate || !workspaceId || !parentPageId) {
      return;
    }

    let cancelled = false;

    const reconnectCanvasPage = async () => {
      const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!response.ok || cancelled) {
        return;
      }

      const pages = (await response.json()) as Page[];
      const fallbackCanvasPage = pages
        .filter(
          (candidate) =>
            candidate.type === "canvas" &&
            candidate.parentId === parentPageId &&
            candidate.title === "Inline Clearing"
        )
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        )[0];

      if (!fallbackCanvasPage || cancelled) {
        return;
      }

      hasLoaded.current = true;
      setCanvasPage(fallbackCanvasPage);
      setIsCreating(false);
      setIsExpanded(true);
      updateCanvasBlockAttrs({
        pageId: fallbackCanvasPage.id,
        autoCreate: false,
      });
    };

    void reconnectCanvasPage();
    const retryTimer = window.setInterval(() => {
      void reconnectCanvasPage();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(retryTimer);
    };
  }, [autoCreate, pageId, parentPageId, updateCanvasBlockAttrs, workspaceId]);

  useEffect(() => {
    if (autoCreate || pageId) {
      setIsExpanded(true);
    }
  }, [autoCreate, pageId]);

  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (!hasLoaded.current && pageId) {
        void loadCanvasPage();
      }
    }
  }, [isExpanded, loadCanvasPage, pageId]);

  // 접힌 상태 - 클릭하면 펼쳐짐
  if (!isExpanded) {
    return (
      <NodeViewWrapper
        className="my-4"
        contentEditable={false}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          onClick={handleExpand}
          data-testid="inline-canvas-collapsed"
          className="cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:bg-zinc-800"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D45]/10">
              <Layout className="h-4 w-4 text-[#2E7D45]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {canvasPage?.title || "Inline Clearing"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isCreating ? "Creating..." : "Click to load canvas"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className="my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <InlineBlockShell activationHint="더블클릭하여 캔버스 편집">
        <div
          data-testid="inline-canvas-embed"
          data-state={
            isLoading ? "loading" : canvasPage ? "ready" : isCreating ? "creating" : "empty"
          }
          className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 not-prose dark:border-zinc-800 dark:bg-zinc-900/70"
        >
          <div
            data-export-ignore="true"
            className="flex items-center justify-end gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
              {workspaceId && canvasPage ? (
                <button
                  type="button"
                  data-testid="inline-canvas-open"
                  onClick={() => router.push(`/workspace/${workspaceId}?page=${canvasPage.id}`)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ) : null}
          </div>

          {isLoading ? (
            <div data-testid="inline-canvas-loading" className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
            </div>
          ) : canvasPage ? (
            <div
              data-testid="inline-canvas-ready"
              className="h-[520px] min-h-[520px]"
            >
              <ClearingBoard
                embedded={true}
                realtimeEnabled={false}
                roomSlug={canvasPage.id}
                title={canvasPage.title || "Inline Clearing"}
              />
            </div>
          ) : (
            <div data-testid="inline-canvas-empty" className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
              {isCreating
                ? "Creating Clearing..."
                : props.editor.isEditable
                ? "Clearing is being prepared."
                : "Clearing preview unavailable."}
            </div>
          )}
        </div>
      </InlineBlockShell>
    </NodeViewWrapper>
  );
}

export const CanvasBlock = Node.create<CanvasBlockExtensionOptions>({
  name: "canvasEmbed",
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
    return ReactNodeViewRenderer(CanvasBlockView);
  },

  addCommands() {
    return {
      insertCanvasEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              pageId: null,
              workspaceId: this.options.workspaceId ?? null,
              parentPageId: this.options.pageId ?? null,
              autoCreate: true,
            },
          }),
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
            .insertContent({
              type: this.name,
              attrs: {
                pageId: null,
                workspaceId: this.options.workspaceId ?? null,
                parentPageId: this.options.pageId ?? null,
                autoCreate: true,
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
    canvasEmbed: {
      insertCanvasEmbed: () => ReturnType;
    };
  }
}
