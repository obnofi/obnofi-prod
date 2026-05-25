import { useCallback, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { AwarenessState } from "@/types/collaboration";

type ContextAwarenessState = AwarenessState & { clientId: number; image?: string | null };

interface UsePageCursorTrackingOptions {
  ydoc: import("yjs").Doc | null | undefined;
  provider: unknown | null | undefined;
  pageId: string | undefined;
  localUserId: string | undefined;
  awarenessStates: ContextAwarenessState[];
  updateCursor: (cursor: {
    type: "page";
    pageId: string;
    canvasPosition: { x: number; y: number } | null;
    databaseCell: null;
  }) => void;
  editorShellRef: React.RefObject<HTMLDivElement | null>;
}

export function usePageCursorTracking({
  ydoc,
  provider,
  pageId,
  localUserId,
  awarenessStates,
  updateCursor,
  editorShellRef,
}: UsePageCursorTrackingOptions) {
  const pageCursorFrameRef = useRef<number | null>(null);
  const pendingPageCursorRef = useRef<{ x: number; y: number } | null>(null);
  const lastSentPageCursorRef = useRef<{ x: number; y: number } | null>(null);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (pageCursorFrameRef.current != null) {
        cancelAnimationFrame(pageCursorFrameRef.current);
      }
    };
  }, []);

  const remotePageCursors = useMemo(
    () =>
      awarenessStates.filter(
        (state) =>
          state.userId !== localUserId &&
          !state.hasTextCursor &&
          state.userCursor?.type === "page" &&
          state.userCursor?.pageId === pageId &&
          state.userCursor.canvasPosition
      ),
    [awarenessStates, localUserId, pageId]
  );

  const flushPageCursor = useCallback(() => {
    pageCursorFrameRef.current = null;
    const nextPosition = pendingPageCursorRef.current;
    pendingPageCursorRef.current = null;
    if (!pageId || !nextPosition) return;

    const rounded = {
      x: Math.round(nextPosition.x),
      y: Math.round(nextPosition.y),
    };
    const previous = lastSentPageCursorRef.current;
    if (previous && previous.x === rounded.x && previous.y === rounded.y) {
      return;
    }

    lastSentPageCursorRef.current = rounded;
    updateCursor({
      type: "page",
      pageId,
      canvasPosition: rounded,
      databaseCell: null,
    });
  }, [pageId, updateCursor]);

  const handlePagePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!ydoc || !provider || !pageId) return;
      const shell = editorShellRef.current;
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      pendingPageCursorRef.current = {
        x: Math.max(0, Math.min(event.clientX - rect.left, rect.width)),
        y: Math.max(0, Math.min(event.clientY - rect.top, rect.height)),
      };

      if (pageCursorFrameRef.current == null) {
        pageCursorFrameRef.current = requestAnimationFrame(flushPageCursor);
      }
    },
    [flushPageCursor, pageId, provider, ydoc, editorShellRef]
  );

  const clearPagePointer = useCallback(() => {
    pendingPageCursorRef.current = null;
    lastSentPageCursorRef.current = null;
    if (pageCursorFrameRef.current != null) {
      cancelAnimationFrame(pageCursorFrameRef.current);
      pageCursorFrameRef.current = null;
    }
    if (!pageId) return;
    updateCursor({
      type: "page",
      pageId,
      canvasPosition: null,
      databaseCell: null,
    });
  }, [pageId, updateCursor]);

  return { remotePageCursors, handlePagePointerMove, clearPagePointer };
}
