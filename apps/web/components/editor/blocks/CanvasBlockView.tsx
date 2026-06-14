"use client";

import { useCallback, useRef } from "react";
import {
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePageStore } from "@/store/pageStore";
import { useEmbeddedPageState } from "@/hooks/useEmbeddedPageState";
import {
  preventInlineBlockDrag,
  stopInlineBlockEventPropagation,
} from "@/lib/editor/inlineBlockInteractions";

const ClearingBoard = dynamic(
  () => import("@/components/canvas/ClearingBoard").then((mod) => mod.ClearingBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
      </div>
    ),
  }
);

export interface CanvasBlockAttrs {
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
  isInlinePage: boolean;
}

export function CanvasBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const attrs = props.node.attrs as CanvasBlockAttrs;
  const { pageId, workspaceId, parentPageId, autoCreate, isInlinePage } = attrs;
  const propsRef = useRef(props);
  propsRef.current = props;

  const cachedPage = usePageStore((state) =>
    pageId
      ? state.pages.find((page) => page.id === pageId) ??
        (state.currentPage?.id === pageId ? state.currentPage : null)
      : null
  );

  const updateCanvasBlockAttrs = useCallback(
    (nextAttrs: Partial<CanvasBlockAttrs>) => {
      const currentProps = propsRef.current;

      if (!currentProps.editor.isEditable || currentProps.editor.isDestroyed) {
        return false;
      }

      const position = currentProps.getPos();
      if (typeof position !== "number") return false;

      const currentNode = currentProps.editor.state.doc.nodeAt(position);
      if (currentNode?.type.name !== currentProps.node.type.name) return false;

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

  const { embeddedPage, isCreating, isLoading, renameEmbeddedPage } = useEmbeddedPageState({
    pageId,
    workspaceId,
    parentPageId,
    autoCreate,
    isInlinePage,
    cachedPage: cachedPage ?? null,
    isEditorEditable: props.editor.isEditable,
    pageType: "canvas",
    emptyTitle: "Inline Clearing",
    updateAttrs: updateCanvasBlockAttrs,
  });

  return (
    <NodeViewWrapper
      className="my-4"
      contentEditable={false}
      data-inline-block="true"
      onDragStart={preventInlineBlockDrag}
      onPointerDown={stopInlineBlockEventPropagation}
      onMouseDown={stopInlineBlockEventPropagation}
      onClick={stopInlineBlockEventPropagation}
    >
      <div
        data-testid="inline-canvas-embed"
        data-state={
          isLoading ? "loading" : embeddedPage ? "ready" : isCreating ? "creating" : "empty"
        }
        className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] not-prose"
      >
        {props.editor.isEditable ? (
          <div
            data-export-ignore="true"
            className="flex items-center justify-end gap-2 border-b border-[var(--color-border)] px-4 py-3"
          >
            {workspaceId && embeddedPage ? (
              <button
                type="button"
                data-testid="inline-canvas-open"
                onClick={() => router.push(`/workspace/${workspaceId}?page=${embeddedPage.id}`)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}

        {isLoading ? (
          <div data-testid="inline-canvas-loading" className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
          </div>
        ) : embeddedPage ? (
          <div data-testid="inline-canvas-ready" className="h-[520px] min-h-[520px]">
            <ClearingBoard
              embedded={true}
              realtimeEnabled={false}
              roomSlug={embeddedPage.id}
              title={embeddedPage.title || "Inline Clearing"}
              onTitleChange={renameEmbeddedPage}
            />
          </div>
        ) : (
          <div data-testid="inline-canvas-empty" className="px-4 py-8 text-sm text-[var(--color-text-secondary)]">
            {isCreating
              ? "Creating Clearing..."
              : props.editor.isEditable
              ? "Clearing is being prepared."
              : "Clearing preview unavailable."}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
