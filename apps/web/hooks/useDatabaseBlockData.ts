import { useCallback, useEffect, useRef, useState } from "react";
import type { Page, PropertyType, ViewType } from "@obnofi/types";
import type { ReactNodeViewProps } from "@tiptap/react";
import { buildEmptyDatabasePage } from "@/lib/database/emptyDatabasePage";
import {
  buildOptimisticPage,
  generateOptimisticPageId,
} from "@/lib/page/pageUtils";
import {
  appendCachedPage,
  removeCachedPage,
  replaceCachedPage,
} from "@/lib/page/pageStoreSync";
import { useGroveCatalogStore } from "@/store/useGroveCatalogStore";

type GroveSurfaceView = Extract<ViewType, "table" | "gallery" | "board" | "calendar">;

export interface DatabaseNodeAttrs {
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

export function useDatabaseBlockData(
  attrs: DatabaseNodeAttrs,
  propsRef: React.MutableRefObject<ReactNodeViewProps>,
) {
  const { workspaceId, parentPageId, autoCreate, pageId, databaseId } = attrs;
  const [databasePages, setDatabasePages] = useState<Page[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const hasLoadedPages = useRef(false);
  const [shouldLoadPages, setShouldLoadPages] = useState(false);

  const updateDatabaseBlockAttrs = useCallback(
    (nextAttrs: Partial<DatabaseNodeAttrs>) => {
      const currentProps = propsRef.current;
      if (!currentProps.editor.isEditable || currentProps.editor.isDestroyed) return;
      const position = currentProps.getPos();
      if (typeof position !== "number") return;
      const currentNode = currentProps.editor.state.doc.nodeAt(position);
      if (currentNode?.type.name !== currentProps.node.type.name) return;
      try {
        currentProps.updateAttributes(nextAttrs);
      } catch (error) {
        if (error instanceof RangeError && error.message.includes("No node at given position")) return;
        throw error;
      }
    },
    [propsRef]
  );

  const loadDatabasePages = useCallback(async () => {
    if (!workspaceId || hasLoadedPages.current) return;
    hasLoadedPages.current = true;
    const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
    if (!response.ok) { hasLoadedPages.current = false; return; }
    const pages = (await response.json()) as Page[];
    setDatabasePages(pages.filter((page) => page.type === "database"));
  }, [workspaceId]);

  useEffect(() => {
    if (shouldLoadPages && !hasLoadedPages.current) {
      void loadDatabasePages();
    }
  }, [shouldLoadPages, loadDatabasePages]);

  const handleSelectionOpen = useCallback(() => {
    setShouldLoadPages(true);
  }, []);

  const createDatabasePage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreatingRef.current) return;
    isCreatingRef.current = true;
    setIsCreating(true);
    const optimisticDatabaseId = generateOptimisticPageId();
    const optimisticPage = buildOptimisticPage(
      {
        title: "Grove Catalog",
        type: "database",
        parentId: parentPageId,
        workspaceId,
        databaseId: optimisticDatabaseId,
      },
      []
    );
    const optimisticDatabasePage = buildEmptyDatabasePage(
      optimisticPage,
      optimisticDatabaseId
    );

    appendCachedPage(optimisticPage);
    setDatabasePages((current) => [...current, optimisticPage]);
    const groveCatalogStore = useGroveCatalogStore.getState();
    groveCatalogStore.setGrovePage(optimisticPage.id, optimisticDatabasePage);
    groveCatalogStore.markGroveLoaded(optimisticPage.id);
    updateDatabaseBlockAttrs({
      pageId: optimisticPage.id,
      databaseId: optimisticDatabaseId,
      autoCreate: false,
    });

    try {
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
      if (!response.ok) {
        throw new Error("Failed to create database page");
      }

      const createdPage = (await response.json()) as Page;
      const createdDatabasePage = buildEmptyDatabasePage(
        createdPage,
        createdPage.databaseId ?? optimisticDatabaseId
      );

      replaceCachedPage(optimisticPage.id, createdPage);
      setDatabasePages((current) =>
        current.map((page) => (page.id === optimisticPage.id ? createdPage : page))
      );
      groveCatalogStore.setGrovePage(optimisticPage.id, null);
      groveCatalogStore.setGrovePage(createdPage.id, createdDatabasePage);
      groveCatalogStore.markGroveLoaded(createdPage.id);
      updateDatabaseBlockAttrs({
        pageId: createdPage.id,
        databaseId: createdPage.databaseId ?? null,
        autoCreate: false,
      });
    } catch {
      removeCachedPage(optimisticPage.id);
      setDatabasePages((current) =>
        current.filter((page) => page.id !== optimisticPage.id)
      );
      groveCatalogStore.setGrovePage(optimisticPage.id, null);
      updateDatabaseBlockAttrs({
        pageId: null,
        databaseId: null,
        autoCreate: false,
      });
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }, [parentPageId, updateDatabaseBlockAttrs, workspaceId]);

  useEffect(() => {
    if (!propsRef.current.editor.isEditable || !autoCreate || pageId) return;
    void createDatabasePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreate, pageId]);

  const selectedValue = (() => {
    if (pageId) return pageId;
    if (databaseId) return databasePages.find((c) => c.databaseId === databaseId)?.id ?? "";
    return "";
  })();

  return {
    databasePages,
    isCreating,
    selectedValue,
    updateDatabaseBlockAttrs,
    loadDatabasePages,
    createDatabasePage,
    handleSelectionOpen,
  };
}
