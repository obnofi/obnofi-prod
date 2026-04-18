import { type Edge, type Node } from "@xyflow/react";
import { Page } from "@/types";

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
  const pageMap = new Map(pages.map((p) => [normalizeLinkTarget(p.title), p.id]));

  // Create nodes
  pages.forEach((page, index) => {
    // Simple circular layout as initial positions
    const angle = (index / pages.length) * 2 * Math.PI;
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

  // Create edges from links
  const edgeSet = new Set<string>();

  pages.forEach((page) => {
    const links = extractLinks(page.content);

    links.forEach((linkTitle) => {
      const targetId = pageMap.get(normalizeLinkTarget(linkTitle));
      if (targetId && targetId !== page.id) {
        const edgeId = `${page.id}-${targetId}`;
        const reverseEdgeId = `${targetId}-${page.id}`;

        // Avoid duplicate edges
        if (!edgeSet.has(edgeId) && !edgeSet.has(reverseEdgeId)) {
          edges.push({
            id: edgeId,
            source: page.id,
            target: targetId,
            type: "default",
          });
          edgeSet.add(edgeId);
        }
      }
    });
  });

  return { nodes, edges };
}
