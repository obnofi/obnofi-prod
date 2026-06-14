import { useEmbeddedPageState } from "@/hooks/useEmbeddedPageState";

type UseCanvasPageStateOptions = Parameters<typeof useEmbeddedPageState>[0];
type UseCanvasPageStateResult = {
  canvasPage: ReturnType<typeof useEmbeddedPageState>["embeddedPage"];
  isCreating: boolean;
  isLoading: boolean;
};

export function useCanvasPageState({
  pageId,
  workspaceId,
  parentPageId,
  autoCreate,
  isInlinePage,
  cachedPage,
  isEditorEditable,
  updateAttrs,
}: UseCanvasPageStateOptions): UseCanvasPageStateResult {
  const result = useEmbeddedPageState({
    pageId,
    workspaceId,
    parentPageId,
    autoCreate,
    isInlinePage,
    cachedPage,
    isEditorEditable,
    pageType: "canvas",
    emptyTitle: "Inline Clearing",
    updateAttrs,
  });

  return {
    canvasPage: result.embeddedPage,
    isCreating: result.isCreating,
    isLoading: result.isLoading,
  };
}
