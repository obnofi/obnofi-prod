import { create } from "zustand";
import {
  Page,
  CreatePageInput,
  UpdatePageInput,
  PageHighlightColor,
} from "@obnofi/types";

const PAGE_ORDER_STEP = 1024;
const DEFAULT_HIGHLIGHT_COLORS: PageHighlightColor[] = [
  "yellow",
  "green",
  "blue",
  "pink",
];

let activePageFetchController: AbortController | null = null;
let activePageFetchSequence = 0;
let activePageFetchPageId: string | null = null;
let activePageFetchPromise: Promise<void> | null = null;
const pageUpdateSequences = new Map<string, number>();

function isOptimisticPageId(pageId: string) {
  return pageId.startsWith("optimistic-");
}

function generateOptimisticPageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `optimistic-${crypto.randomUUID()}`;
  }
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mergePagePreservingDocumentContent(
  previousPage: Page,
  nextPage: Page,
  input: UpdatePageInput
): Page {
  if ("content" in input) {
    return nextPage;
  }

  if (previousPage.type !== "document") {
    return nextPage;
  }

  return {
    ...nextPage,
    content: previousPage.content,
  };
}

function mergeCachedPage(previousPage: Page | null | undefined, nextPage: Page): Page {
  if (!previousPage) {
    return nextPage;
  }

  const previousUpdatedAt = new Date(previousPage.updatedAt).getTime();
  const nextUpdatedAt = new Date(nextPage.updatedAt).getTime();
  const shouldPreserveLocalTitle = previousUpdatedAt > nextUpdatedAt;

  return {
    ...previousPage,
    ...nextPage,
    title: shouldPreserveLocalTitle ? previousPage.title : nextPage.title,
    content:
      nextPage.content !== null
        ? nextPage.content
        : previousPage.content,
  };
}

function upsertCachedPage(pages: Page[], nextPage: Page): Page[] {
  let found = false;
  const mergedPages = pages.map((page) => {
    if (page.id !== nextPage.id) {
      return page;
    }

    found = true;
    return mergeCachedPage(page, nextPage);
  });

  return found ? mergedPages : [...mergedPages, nextPage];
}

function mergePageListCache(previousPages: Page[], nextPages: Page[]): Page[] {
  const previousPageMap = new Map(previousPages.map((page) => [page.id, page]));

  return nextPages.map((page) => mergeCachedPage(previousPageMap.get(page.id), page));
}

function buildOptimisticPage(
  input: CreatePageInput,
  existingPages: Page[]
): Page {
  const siblingOrder = existingPages
    .filter((p) => (p.parentId ?? null) === (input.parentId ?? null) && !p.parentDatabaseId)
    .reduce((max, p) => Math.max(max, p.order), -PAGE_ORDER_STEP);
  const now = new Date().toISOString();

  return {
    id: generateOptimisticPageId(),
    title: input.title,
    groveTitleLevel: 1,
    bodyFontSizePt: 12,
    headingFontSizes: { h1: 30, h2: 23, h3: 18, h4: 16, h5: 14 },
    highlightColors: DEFAULT_HIGHLIGHT_COLORS,
    content:
      input.type === "document"
        ? input.content ?? { type: "doc", content: [{ type: "paragraph" }] }
        : null,
    type: input.type,
    icon: null,
    coverImage: null,
    parentId: input.parentId ?? null,
    order: siblingOrder + PAGE_ORDER_STEP,
    workspaceId: input.workspaceId,
    createdAt: now,
    updatedAt: now,
    yjsUpdatedAt: null,
    isPublic: false,
    shareId: null,
    sharePassword: null,
    databaseId: input.databaseId ?? null,
    parentDatabaseId: null,
    collaborationEnabled: false,
    lineIndicatorEnabled: false,
  };
}

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  isLoading: boolean;
  error: string | null;
  /** SSR/fetch로 페이지 목록이 채워진 워크스페이스 id. 같은 워크스페이스에서 중복 fetch를 막는 데 사용. */
  initializedWorkspaceId: string | null;

  // Actions
  fetchPages: (workspaceId: string) => Promise<void>;
  fetchPage: (pageId: string) => Promise<void>;
  createPage: (input: CreatePageInput) => Promise<Page | null>;
  updatePage: (pageId: string, input: UpdatePageInput) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  setCurrentPage: (
    page:
      | Page
      | null
      | ((currentPage: Page | null) => Page | null)
  ) => void;
  setPages: (pages: Page[], workspaceId?: string) => void;
  getChildPages: (parentId: string | null) => Page[];
  getPageTree: () => PageTreeNode[];
  getPageTrail: (pageId: string) => Page[];
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

function buildPageTree(pages: Page[]): PageTreeNode[] {
  const pageMap = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  // Initialize all pages with empty children array
  pages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [] });
  });

  // Build tree structure
  pages.forEach((page) => {
    const node = pageMap.get(page.id)!;
    if (page.parentId && pageMap.has(page.parentId)) {
      const parent = pageMap.get(page.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort siblings by explicit order first, then updatedAt for a stable tie-breaker.
  const sortNodes = (nodes: PageTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        a.order - b.order ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  isLoading: false,
  error: null,
  initializedWorkspaceId: null,

  fetchPages: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch pages");
      const pages = await response.json();
      set((state) => ({
        pages: mergePageListCache(state.pages, pages),
        isLoading: false,
        initializedWorkspaceId: workspaceId,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchPage: async (pageId: string) => {
    const cachedPage = get().pages.find((page) => page.id === pageId) ?? null;
    const canUseCachedPage = cachedPage !== null;
    let controller: AbortController | null = null;
    let fetchSequence = 0;

    set({
      isLoading: true,
      error: null,
      currentPage: canUseCachedPage
        ? cachedPage
        : get().currentPage?.id === pageId
          ? get().currentPage
          : null,
    });

    if (activePageFetchPageId === pageId && activePageFetchPromise) {
      try {
        await activePageFetchPromise;
      } catch {
        // The owner request updates store error state; duplicate callers only wait.
      }
      return;
    }

    try {
      if (isOptimisticPageId(pageId)) {
        const optimisticPage =
          get().pages.find((page) => page.id === pageId) ?? null;

        set({
          currentPage: optimisticPage,
          isLoading: false,
          error: optimisticPage ? null : "Page not found",
        });
        return;
      }

      activePageFetchController?.abort();
      controller = new AbortController();
      activePageFetchController = controller;
      activePageFetchPageId = pageId;
      fetchSequence = ++activePageFetchSequence;

      activePageFetchPromise = (async () => {
        const response = await fetch(`/api/pages/${pageId}`, {
          signal: controller?.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch page");
        const page = await response.json();

        if (fetchSequence !== activePageFetchSequence) {
          return;
        }

        if (controller && activePageFetchController === controller) {
          activePageFetchController = null;
        }

        set((state) => {
          const cachedPage = state.pages.find((p) => p.id === page.id);
          const nextCurrentPage = mergeCachedPage(cachedPage, page);

          return {
            pages: upsertCachedPage(state.pages, nextCurrentPage),
            currentPage: nextCurrentPage,
            isLoading: false,
          };
        });
      })();

      await activePageFetchPromise;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (fetchSequence === activePageFetchSequence) {
          set({ isLoading: false });
        }
        return;
      }

      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
        currentPage:
          get().currentPage?.id === pageId ? get().currentPage : null,
      });
    } finally {
      if (controller && activePageFetchController === controller) {
        activePageFetchController = null;
      }
      if (activePageFetchPageId === pageId) {
        activePageFetchPageId = null;
        activePageFetchPromise = null;
      }
    }
  },

  createPage: async (input: CreatePageInput) => {
    const optimisticPage = buildOptimisticPage(input, get().pages);

    set((state) => ({
      pages: [...state.pages, optimisticPage],
      error: null,
    }));

    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to create page");
      const newPage: Page = await response.json();
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === optimisticPage.id ? newPage : p
        ),
      }));
      return newPage;
    } catch (error) {
      set((state) => ({
        pages: state.pages.filter((p) => p.id !== optimisticPage.id),
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      return null;
    }
  },

  updatePage: async (pageId: string, input: UpdatePageInput) => {
    const previousState = get();
    const previousPages = previousState.pages;
    const previousCurrentPage = previousState.currentPage;
    const optimisticPage = previousPages.find((page) => page.id === pageId);
    const updateSequence = (pageUpdateSequences.get(pageId) ?? 0) + 1;
    pageUpdateSequences.set(pageId, updateSequence);

    if (!optimisticPage) {
      return;
    }

    const nextPage: Page = {
      ...optimisticPage,
      ...input,
      headingFontSizes: input.headingFontSizes
        ? {
            ...optimisticPage.headingFontSizes,
            ...input.headingFontSizes,
          }
        : optimisticPage.headingFontSizes,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      pages: state.pages.map((page) => (page.id === pageId ? nextPage : page)),
      currentPage:
        state.currentPage?.id === pageId
          ? {
              ...state.currentPage,
              ...input,
              headingFontSizes: input.headingFontSizes
                ? {
                    ...state.currentPage.headingFontSizes,
                    ...input.headingFontSizes,
                  }
                : state.currentPage.headingFontSizes,
              updatedAt: nextPage.updatedAt,
            }
          : state.currentPage,
      error: null,
    }));

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to update page");
      const updatedPage = await response.json();
      if (pageUpdateSequences.get(pageId) !== updateSequence) {
        return;
      }
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === pageId
            ? mergePagePreservingDocumentContent(p, updatedPage, input)
            : p
        ),
        currentPage:
          state.currentPage?.id === pageId
            ? mergePagePreservingDocumentContent(
                state.currentPage,
                updatedPage,
                input
              )
            : state.currentPage,
      }));
    } catch (error) {
      if (pageUpdateSequences.get(pageId) !== updateSequence) {
        return;
      }

      if ("title" in input && Object.keys(input).length === 1) {
        set({
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }

      set({
        pages: previousPages,
        currentPage: previousCurrentPage,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  deletePage: async (pageId: string) => {
    const previousState = get();
    const previousPages = previousState.pages;
    const previousCurrentPage = previousState.currentPage;

    const toRemove = new Set<string>();
    const queue = [pageId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (toRemove.has(current)) continue;
      toRemove.add(current);
      previousPages.forEach((p) => {
        if (p.parentId === current && !toRemove.has(p.id)) {
          queue.push(p.id);
        }
      });
    }

    set({
      pages: previousPages.filter((p) => !toRemove.has(p.id)),
      currentPage: toRemove.has(previousCurrentPage?.id ?? "")
        ? null
        : previousCurrentPage,
      error: null,
    });

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to delete page");
      }
    } catch (error) {
      set({
        pages: previousPages,
        currentPage: previousCurrentPage,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  setCurrentPage: (pageOrUpdater) =>
    set((state) => {
      const nextCurrentPage =
        typeof pageOrUpdater === "function"
          ? pageOrUpdater(state.currentPage)
          : pageOrUpdater;

      return {
        currentPage: nextCurrentPage,
        pages: nextCurrentPage
          ? state.pages.map((page) =>
              page.id === nextCurrentPage.id ? nextCurrentPage : page
            )
          : state.pages,
      };
    }),

  setPages: (pages: Page[], workspaceId?: string) =>
    set((state) => {
      const shouldPreserveCache =
        workspaceId === undefined || state.initializedWorkspaceId === workspaceId;

      return workspaceId !== undefined
        ? {
            pages: shouldPreserveCache
              ? mergePageListCache(state.pages, pages)
              : pages,
            initializedWorkspaceId: workspaceId,
          }
        : {
            pages: mergePageListCache(state.pages, pages),
          };
    }),

  getChildPages: (parentId: string | null) => {
    const { pages } = get();
    return pages.filter((p) => p.parentId === parentId);
  },

  getPageTree: () => buildPageTree(get().pages),

  getPageTrail: (pageId: string) => {
    const { pages } = get();
    const pageMap = new Map(pages.map((page) => [page.id, page]));
    const trail: Page[] = [];
    const visited = new Set<string>();
    let cursor = pageMap.get(pageId) ?? null;

    while (cursor && !visited.has(cursor.id)) {
      trail.unshift(cursor);
      visited.add(cursor.id);
      cursor = cursor.parentId ? pageMap.get(cursor.parentId) ?? null : null;
    }

    return trail;
  },
}));
