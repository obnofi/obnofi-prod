"use client";

import { useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import type { MutableRefObject } from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { usePageStore } from "@/store/pageStore";
import { Page, PageType } from "@obnofi/types";
import { createPageTitles } from "@/lib/pageCreation";
import { exportPageAsHtml, exportPageAsPdf } from "@/lib/exportPage";
import type { PageExportFormat } from "@/components/workspace/PageSettingsMenu";

interface UseWorkspacePageHandlersOptions {
  pageId: string;
  workspaceId: string;
  editorInstanceRef: MutableRefObject<TiptapEditor | null>;
  groveContentElement: HTMLDivElement | null;
  titleSaveTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function useWorkspacePageHandlers({
  pageId,
  workspaceId,
  editorInstanceRef,
  groveContentElement,
  titleSaveTimerRef,
}: UseWorkspacePageHandlersOptions) {
  const router = useRouter();
  const { updatePage, createPage, setCurrentPage, currentPage } = usePageStore();

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      const updatedAt = new Date().toISOString();

      setCurrentPage((page) =>
        page ? { ...page, title: newTitle, updatedAt } : page
      );

      if (titleSaveTimerRef.current) {
        clearTimeout(titleSaveTimerRef.current);
      }

      titleSaveTimerRef.current = setTimeout(() => {
        void updatePage(pageId, { title: newTitle });
        titleSaveTimerRef.current = null;
      }, 1200);
    },
    [pageId, setCurrentPage, titleSaveTimerRef, updatePage]
  );

  const handlePageChromeUpdate = useCallback(
    async (input: Partial<Pick<Page, "icon" | "coverImage">>) => {
      await updatePage(pageId, input);
    },
    [pageId, updatePage]
  );

  const handleHeadingFontSizesChange = useCallback(
    (headingFontSizes: Page["headingFontSizes"]) => {
      setCurrentPage((page) => (page ? { ...page, headingFontSizes } : page));
    },
    [setCurrentPage]
  );

  const handleHighlightColorsChange = useCallback(
    (highlightColors: Page["highlightColors"]) => {
      setCurrentPage((page) => (page ? { ...page, highlightColors } : page));
    },
    [setCurrentPage]
  );

  const handleCollaborationEnabledChange = useCallback(
    async (enabled: boolean) => {
      setCurrentPage((page) =>
        page ? { ...page, collaborationEnabled: enabled } : page
      );
      await updatePage(pageId, { collaborationEnabled: enabled });
    },
    [pageId, updatePage, setCurrentPage]
  );

  const handleLineIndicatorEnabledChange = useCallback(
    async (enabled: boolean) => {
      setCurrentPage((page) =>
        page ? { ...page, lineIndicatorEnabled: enabled } : page
      );
      await updatePage(pageId, { lineIndicatorEnabled: enabled });
    },
    [pageId, updatePage, setCurrentPage]
  );

  const handleSelectPage = useCallback(
    (selectedPageId: string) => {
      if (selectedPageId === pageId) return;
      startTransition(() => {
        router.push(`/workspace/${workspaceId}?page=${selectedPageId}`);
      });
    },
    [pageId, router, workspaceId]
  );

  const handleExportPage = useCallback(
    (format: PageExportFormat) => {
      if (!currentPage || currentPage.type !== "document") return;
      const params = {
        editor: editorInstanceRef.current,
        contentElement: groveContentElement,
        page: {
          title: currentPage.title,
          icon: currentPage.icon,
          coverImage: currentPage.coverImage,
          type: currentPage.type,
        },
      };
      if (format === "pdf") exportPageAsPdf(params);
      else exportPageAsHtml(params);
    },
    [currentPage, editorInstanceRef, groveContentElement]
  );

  const handleCreateChildPage = useCallback(
    async (type: PageType) => {
      const newPage = await createPage({
        title: createPageTitles[type],
        type,
        parentId: pageId,
        workspaceId,
      });
      if (newPage) {
        router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
      }
    },
    [createPage, pageId, router, workspaceId]
  );

  return {
    handleTitleChange,
    handlePageChromeUpdate,
    handleHeadingFontSizesChange,
    handleHighlightColorsChange,
    handleCollaborationEnabledChange,
    handleLineIndicatorEnabledChange,
    handleSelectPage,
    handleExportPage,
    handleCreateChildPage,
  };
}
