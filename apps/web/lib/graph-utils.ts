import { type Edge, type Node } from "@xyflow/react";
import { Page } from "@obnofi/types";

export interface CustomNoteNodeData extends Record<string, unknown> {
  title: string;
  path: string;
  pageId: string;
  animationIndex: number;
}

export interface CustomDatabaseNodeData extends Record<string, unknown> {
  title: string;
  path: string;
  pageId: string;
  databaseId: string | null | undefined;
  animationIndex: number;
}

export type GraphNode = Node<CustomNoteNodeData, "customNote"> | Node<CustomDatabaseNodeData, "customDatabase">;
export type GraphDatabaseNode = Node<CustomDatabaseNodeData, "customDatabase">;

export type GraphEdge = Edge;

const LINK_REGEX = /\[\[([^\]]+)\]\]/g;

type PageReference = {
  pageId?: string;
  pageTitle?: string;
};

type ContentData = {
  pageReferences: PageReference[];
  canvasPageIds: string[];
  wikiLinks: string[];
};

function normalizeLinkTarget(value: string) {
  return value
    .split("|")[0]
    .trim()
    .toLowerCase();
}

function collectContentData(value: unknown, result: ContentData): void {
  if (!value) return;

  if (typeof value === "string") {
    for (const match of value.matchAll(LINK_REGEX)) {
      result.wikiLinks.push(match[1].trim());
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectContentData(item, result);
    return;
  }

  if (typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  const attrs = record.attrs;

  if (attrs && typeof attrs === "object") {
    if (record.type === "pageLink") {
      const linkAttrs = attrs as Record<string, unknown>;
      const pageId = typeof linkAttrs.pageId === "string" ? linkAttrs.pageId : undefined;
      const pageTitle = typeof linkAttrs.pageTitle === "string" ? linkAttrs.pageTitle : undefined;
      if (pageId || pageTitle) result.pageReferences.push({ pageId, pageTitle });
    } else if (record.type === "canvasEmbed") {
      const canvasAttrs = attrs as Record<string, unknown>;
      if (typeof canvasAttrs.pageId === "string") result.canvasPageIds.push(canvasAttrs.pageId);
    }
  }

  for (const item of Object.values(record)) collectContentData(item, result);
}

export function buildGraphData(pages: Page[]): {
  nodes: Array<Node<CustomNoteNodeData, "customNote"> | Node<CustomDatabaseNodeData, "customDatabase">>;
  edges: GraphEdge[];
} {
  const nodes: Array<Node<CustomNoteNodeData, "customNote"> | Node<CustomDatabaseNodeData, "customDatabase">> = [];
  const edges: GraphEdge[] = [];

  // Single pass: collect all content data per page
  const embeddedCanvasPageIds = new Set<string>();
  const pageContentData = new Map<string, ContentData>();
  for (const page of pages) {
    const data: ContentData = { pageReferences: [], canvasPageIds: [], wikiLinks: [] };
    collectContentData(page.content, data);
    pageContentData.set(page.id, data);
    for (const id of data.canvasPageIds) embeddedCanvasPageIds.add(id);
  }

  const graphPages = pages.filter(
    (page) => !(page.type === "canvas" && embeddedCanvasPageIds.has(page.id))
  );
  const pageMap = new Map(graphPages.map((p) => [normalizeLinkTarget(p.title), p.id]));
  const pageIds = new Set(graphPages.map((page) => page.id));
  const edgeSet = new Set<string>();

  const addEdge = (source: string, target: string) => {
    if (source === target || !pageIds.has(source) || !pageIds.has(target)) return;
    const edgeId = `${source}-${target}`;
    const reverseEdgeId = `${target}-${source}`;
    if (edgeSet.has(edgeId) || edgeSet.has(reverseEdgeId)) return;
    edges.push({ id: edgeId, source, target, type: "floating", zIndex: -1 });
    edgeSet.add(edgeId);
  };

  const total = graphPages.length;
  const radius = 300;

  graphPages.forEach((page, index) => {
    const angle = (index / total) * 2 * Math.PI;
    const x = Math.cos(angle) * radius + 420;
    const y = Math.sin(angle) * radius + 320;

    if (page.type === "database") {
      nodes.push({
        id: page.id, type: "customDatabase", zIndex: 1,
        position: { x, y },
        data: { title: page.title, path: `/workspace/${page.workspaceId}?page=${page.id}`, pageId: page.id, databaseId: page.databaseId, animationIndex: index },
      } as Node<CustomDatabaseNodeData, "customDatabase">);
    } else {
      nodes.push({
        id: page.id, type: "customNote", zIndex: 1,
        position: { x, y },
        data: { title: page.title, path: `/workspace/${page.workspaceId}?page=${page.id}`, pageId: page.id, animationIndex: index },
      } as Node<CustomNoteNodeData, "customNote">);
    }

    const contentData = pageContentData.get(page.id);
    if (contentData) {
      for (const ref of contentData.pageReferences) {
        const targetId = ref.pageId ?? (ref.pageTitle ? pageMap.get(normalizeLinkTarget(ref.pageTitle)) : undefined);
        if (targetId) addEdge(page.id, targetId);
      }
      for (const linkTitle of contentData.wikiLinks) {
        const targetId = pageMap.get(normalizeLinkTarget(linkTitle));
        if (targetId) addEdge(page.id, targetId);
      }
    }
  });

  return { nodes, edges };
}
