import { Page, CreatePageInput, UpdatePageInput, PageHighlightColor } from "@obnofi/types";

export const PAGE_ORDER_STEP = 1024;
export const DEFAULT_HIGHLIGHT_COLORS: PageHighlightColor[] = [
  "yellow",
  "green",
  "blue",
  "pink",
];

export function isOptimisticPageId(pageId: string) {
  return pageId.startsWith("optimistic-");
}

export function generateOptimisticPageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `optimistic-${crypto.randomUUID()}`;
  }
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function mergePagePreservingDocumentContent(
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

export function mergeCachedPage(previousPage: Page | null | undefined, nextPage: Page): Page {
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

export function upsertCachedPage(pages: Page[], nextPage: Page): Page[] {
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

export function mergePageListCache(previousPages: Page[], nextPages: Page[]): Page[] {
  const previousPageMap = new Map(previousPages.map((page) => [page.id, page]));

  return nextPages.map((page) => mergeCachedPage(previousPageMap.get(page.id), page));
}

export function buildOptimisticPage(
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
    collaborationEnabled:
      input.type === "document" ? input.collaborationEnabled ?? true : false,
    lineIndicatorEnabled:
      input.type === "document" ? input.lineIndicatorEnabled ?? false : false,
  };
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

export function buildPageTree(pages: Page[]): PageTreeNode[] {
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
