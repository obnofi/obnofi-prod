import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "@obnofi/types";
import { canvasPageCache, canvasPageRequestCache } from "@/components/editor/blocks/CanvasBlockView";

interface UseCanvasPageStateOptions {
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
  cachedPage: Page | null | undefined;
  isEditorEditable: boolean;
  updateAttrs: (next: { pageId?: string | null; autoCreate?: boolean }) => boolean;
}

interface UseCanvasPageStateResult {
  canvasPage: Page | null;
  isCreating: boolean;
  isLoading: boolean;
}

export function useCanvasPageState({
  pageId,
  workspaceId,
  parentPageId,
  autoCreate,
  cachedPage,
  isEditorEditable,
  updateAttrs,
}: UseCanvasPageStateOptions): UseCanvasPageStateResult {
  const [canvasPage, setCanvasPage] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasLoaded = useRef(false);
  const hasAttemptedReconnect = useRef(false);
  const isCreatingRef = useRef(false);

  const loadCanvasPage = useCallback(async () => {
    if (!pageId || hasLoaded.current) {
      if (!pageId) setCanvasPage(null);
      return;
    }

    const pageFromStore = cachedPage;
    if (pageFromStore) {
      canvasPageCache.set(pageId, pageFromStore);
      hasLoaded.current = true;
      setCanvasPage(pageFromStore);
      return;
    }

    const pageFromCache = canvasPageCache.get(pageId);
    if (pageFromCache) {
      hasLoaded.current = true;
      setCanvasPage(pageFromCache);
      return;
    }

    hasLoaded.current = true;
    setIsLoading(true);

    let request = canvasPageRequestCache.get(pageId);
    if (!request) {
      request = fetch(`/api/pages/${pageId}`)
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as Page;
        })
        .finally(() => {
          canvasPageRequestCache.delete(pageId);
        });
      canvasPageRequestCache.set(pageId, request);
    }

    const page = await request;
    if (!page) {
      setCanvasPage(null);
      hasLoaded.current = false;
      setIsLoading(false);
      return;
    }

    canvasPageCache.set(pageId, page);
    setCanvasPage(page);
    setIsLoading(false);
  }, [cachedPage, pageId]);

  const createCanvasPage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreatingRef.current) return;

    isCreatingRef.current = true;
    setIsCreating(true);
    updateAttrs({ autoCreate: false });

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
      updateAttrs({ autoCreate: true });
      return;
    }

    const createdPage = (await response.json()) as Page;
    canvasPageCache.set(createdPage.id, createdPage);
    hasLoaded.current = true;
    setCanvasPage(createdPage);
    updateAttrs({ pageId: createdPage.id, autoCreate: false });
  }, [parentPageId, updateAttrs, workspaceId]);

  // Auto-create on mount
  useEffect(() => {
    if (!isEditorEditable || !autoCreate || pageId) return;
    void createCanvasPage();
  }, [autoCreate, createCanvasPage, isEditorEditable, pageId]);

  // Sync from page store cache
  useEffect(() => {
    if (!pageId) {
      hasLoaded.current = false;
      setCanvasPage(null);
      return;
    }

    if (cachedPage) {
      canvasPageCache.set(pageId, cachedPage);
      hasLoaded.current = true;
      setCanvasPage(cachedPage);
    }
  }, [cachedPage, pageId]);

  // Fetch page if not yet loaded
  useEffect(() => {
    if (!pageId || hasLoaded.current) return;
    void loadCanvasPage();
  }, [loadCanvasPage, pageId]);

  // Reconnect orphaned blocks: find matching canvas page by title + parentId
  useEffect(() => {
    if (pageId) {
      hasAttemptedReconnect.current = false;
      return;
    }

    if (autoCreate || !workspaceId || !parentPageId || hasAttemptedReconnect.current) {
      return;
    }

    hasAttemptedReconnect.current = true;
    let cancelled = false;

    const reconnect = async () => {
      const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!response.ok || cancelled) return;

      const pages = (await response.json()) as Page[];
      const fallback = pages
        .filter(
          (p) =>
            p.type === "canvas" &&
            p.parentId === parentPageId &&
            p.title === "Inline Clearing"
        )
        .sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

      if (!fallback || cancelled) return;

      hasLoaded.current = true;
      setCanvasPage(fallback);
      setIsCreating(false);
      updateAttrs({ pageId: fallback.id, autoCreate: false });
    };

    void reconnect();
    return () => { cancelled = true; };
  }, [autoCreate, pageId, parentPageId, updateAttrs, workspaceId]);

  return { canvasPage, isCreating, isLoading };
}
