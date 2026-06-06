import type { Page } from "@obnofi/types";
import { usePageStore } from "@/store/pageStore";
import { mergeCachedPage } from "@/lib/page/pageUtils";

export function patchCachedPageTitle(pageId: string, title: string) {
  usePageStore.setState((state) => ({
    pages: state.pages.map((page) =>
      page.id === pageId ? { ...page, title, updatedAt: new Date().toISOString() } : page
    ),
    currentPage:
      state.currentPage?.id === pageId
        ? { ...state.currentPage, title, updatedAt: new Date().toISOString() }
        : state.currentPage,
  }));
}

export function replaceCachedPage(previousPageId: string, nextPage: Page) {
  usePageStore.setState((state) => {
    const hasExisting = state.pages.some((page) => page.id === previousPageId);
    const pages = hasExisting
      ? state.pages.map((page) => (page.id === previousPageId ? nextPage : page))
      : state.pages;

    return {
      pages: pages.map((page) =>
        page.id === nextPage.id ? mergeCachedPage(page, nextPage) : page
      ),
      currentPage:
        state.currentPage?.id === previousPageId || state.currentPage?.id === nextPage.id
          ? mergeCachedPage(state.currentPage, nextPage)
          : state.currentPage,
    };
  });
}

export function appendCachedPage(page: Page) {
  usePageStore.setState((state) => ({
    pages: [...state.pages, page],
  }));
}

export function removeCachedPage(pageId: string) {
  usePageStore.setState((state) => ({
    pages: state.pages.filter((page) => page.id !== pageId),
    currentPage: state.currentPage?.id === pageId ? null : state.currentPage,
  }));
}
