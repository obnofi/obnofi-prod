import { type Edge, type Node } from "@xyflow/react";
import { Page } from "@obnofi/types";

export interface CustomNoteNodeData extends Record<string, unknown> {
  title: string;
  path: string;
  pageId: string;
}

export interface CustomDatabaseNodeData extends Record<string, unknown> {
  title: string;
  path: string;
  pageId: string;
  databaseId: string | null | undefined;
}

export type GraphNode = Node<CustomNoteNodeData, "customNote"> | Node<CustomDatabaseNodeData, "customDatabase">;
export type GraphDatabaseNode = Node<CustomDatabaseNodeData, "customDatabase">;

export type GraphEdge = Edge;

const LINK_REGEX = /\[\[([^\]]+)\]\]/g;

type PageReference = {
  pageId?: string;
  pageTitle?: string;
};

function normalizeLinkTarget(value: string) {
  return value
    .split("|")[0]
    .trim()
    .toLowerCase();
}

function collectText(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item));
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap((item) => collectText(item));
  }

  return [];
}

function collectPageReferences(value: unknown): PageReference[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectPageReferences(item));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const attrs = record.attrs;
  const refs: PageReference[] = [];

  if (record.type === "pageLink" && attrs && typeof attrs === "object") {
    const linkAttrs = attrs as Record<string, unknown>;
    const pageId =
      typeof linkAttrs.pageId === "string" ? linkAttrs.pageId : undefined;
    const pageTitle =
      typeof linkAttrs.pageTitle === "string" ? linkAttrs.pageTitle : undefined;

    if (pageId || pageTitle) {
      refs.push({ pageId, pageTitle });
    }
  }

  Object.values(record).forEach((item) => {
    refs.push(...collectPageReferences(item));
  });

  return refs;
}

function collectEmbeddedCanvasPageIds(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectEmbeddedCanvasPageIds(item));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const attrs = record.attrs;
  const pageIds: string[] = [];

  if (record.type === "canvasEmbed" && attrs && typeof attrs === "object") {
    const canvasAttrs = attrs as Record<string, unknown>;
    if (typeof canvasAttrs.pageId === "string") {
      pageIds.push(canvasAttrs.pageId);
    }
  }

  Object.values(record).forEach((item) => {
    pageIds.push(...collectEmbeddedCanvasPageIds(item));
  });

  return pageIds;
}

export function extractLinks(content: object | null): string[] {
  if (!content) {
    return [];
  }

  const links: string[] = [];
  const sourceText = collectText(content).join(" ");

  for (const match of sourceText.matchAll(LINK_REGEX)) {
    links.push(match[1].trim());
  }

  return links;
}

export function buildGraphData(pages: Page[]): {
  nodes: Array<Node<CustomNoteNodeData, "customNote"> | Node<CustomDatabaseNodeData, "customDatabase">>;
  edges: GraphEdge[];
} {
  const nodes: Array<Node<CustomNoteNodeData, "customNote"> | Node<CustomDatabaseNodeData, "customDatabase">> = [];
  const edges: GraphEdge[] = [];
  const embeddedCanvasPageIds = new Set(
    pages.flatMap((page) => collectEmbeddedCanvasPageIds(page.content))
  );
  const graphPages = pages.filter(
    (page) => !(page.type === "canvas" && embeddedCanvasPageIds.has(page.id))
  );
  const pageMap = new Map(graphPages.map((p) => [normalizeLinkTarget(p.title), p.id]));
  const pageIds = new Set(graphPages.map((page) => page.id));
  const edgeSet = new Set<string>();

  const addEdge = (source: string, target: string) => {
    if (source === target || !pageIds.has(source) || !pageIds.has(target)) {
      return;
    }

    const edgeId = `${source}-${target}`;
    const reverseEdgeId = `${target}-${source}`;

    // Keep the graph visually undirected by avoiding mirrored duplicates.
    if (edgeSet.has(edgeId) || edgeSet.has(reverseEdgeId)) {
      return;
    }

    edges.push({
      id: edgeId,
      source,
      target,
      type: "default",
    });
    edgeSet.add(edgeId);
  };

  // Create nodes
  graphPages.forEach((page, index) => {
    // Simple circular layout as initial positions
    const angle = (index / graphPages.length) * 2 * Math.PI;
    const radius = 300;

    const isDatabase = page.type === "database";

    if (isDatabase) {
      nodes.push({
        id: page.id,
        type: "customDatabase",
        position: {
          x: Math.cos(angle) * radius + 420,
          y: Math.sin(angle) * radius + 320,
        },
        data: {
          title: page.title,
          path: `/workspace/${page.workspaceId}?page=${page.id}`,
          pageId: page.id,
          databaseId: page.databaseId,
        },
      } as Node<CustomDatabaseNodeData, "customDatabase">);
    } else {
      nodes.push({
        id: page.id,
        type: "customNote",
        position: {
          x: Math.cos(angle) * radius + 420,
          y: Math.sin(angle) * radius + 320,
        },
        data: {
          title: page.title,
          path: `/workspace/${page.workspaceId}?page=${page.id}`,
          pageId: page.id,
        },
      } as Node<CustomNoteNodeData, "customNote">);
    }
  });

  // Create edges from page hierarchy and explicit page links.
  graphPages.forEach((page) => {
    if (page.parentId) {
      addEdge(page.parentId, page.id);
    }

    collectPageReferences(page.content).forEach((reference) => {
      const targetId =
        reference.pageId ??
        (reference.pageTitle
          ? pageMap.get(normalizeLinkTarget(reference.pageTitle))
          : undefined);

      if (targetId) {
        addEdge(page.id, targetId);
      }
    });

    const links = extractLinks(page.content);

    links.forEach((linkTitle) => {
      const targetId = pageMap.get(normalizeLinkTarget(linkTitle));
      if (targetId) {
        addEdge(page.id, targetId);
      }
    });
  });

  return { nodes, edges };
}
