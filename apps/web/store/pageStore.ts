import { create } from "zustand";
import { Page, PageType, CreatePageInput, UpdatePageInput } from "@obnofi/types";

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPages: (workspaceId: string) => Promise<void>;
  fetchPage: (pageId: string) => Promise<void>;
  createPage: (input: CreatePageInput) => Promise<Page | null>;
  updatePage: (pageId: string, input: UpdatePageInput) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  setCurrentPage: (page: Page | null) => void;
  setPages: (pages: Page[]) => void;
  getChildPages: (parentId: string | null) => Page[];
  getPageTree: () => PageTreeNode[];
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

  // Sort by updatedAt descending
  const sortByDate = (nodes: PageTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    nodes.forEach((node) => sortByDate(node.children));
  };
  sortByDate(roots);

  return roots;
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  isLoading: false,
  error: null,

  fetchPages: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch pages");
      const pages = await response.json();
      set({ pages, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchPage: async (pageId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      if (!response.ok) throw new Error("Failed to fetch page");
      const page = await response.json();
      set({ currentPage: page, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  createPage: async (input: CreatePageInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to create page");
      const newPage = await response.json();
      set((state) => ({
        pages: [...state.pages, newPage],
        isLoading: false,
      }));
      return newPage;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      return null;
    }
  },

  updatePage: async (pageId: string, input: UpdatePageInput) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to update page");
      const updatedPage = await response.json();
      set((state) => ({
        pages: state.pages.map((p) => (p.id === pageId ? updatedPage : p)),
        currentPage:
          state.currentPage?.id === pageId ? updatedPage : state.currentPage,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  deletePage: async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete page");
      set((state) => {
        const toRemove = new Set<string>();
        const queue = [pageId];
        while (queue.length > 0) {
          const current = queue.shift()!;
          toRemove.add(current);
          state.pages.forEach((p) => {
            if (p.parentId === current && !toRemove.has(p.id)) {
              queue.push(p.id);
            }
          });
        }
        return {
          pages: state.pages.filter((p) => !toRemove.has(p.id)),
          currentPage: toRemove.has(state.currentPage?.id ?? "")
            ? null
            : state.currentPage,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  setCurrentPage: (page: Page | null) => set({ currentPage: page }),

  setPages: (pages: Page[]) => set({ pages }),

  getChildPages: (parentId: string | null) => {
    const { pages } = get();
    return pages.filter((p) => p.parentId === parentId);
  },

  getPageTree: () => {
    const { pages } = get();
    return buildPageTree(pages);
  },
}));
