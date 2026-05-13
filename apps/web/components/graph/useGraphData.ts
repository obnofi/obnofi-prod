"use client";

import { useMemo } from "react";
import type { Page } from "@obnofi/types";

export interface GraphLinkNode extends Record<string, unknown> {
  id: string;
  label: string;
  backlinkCount: number;
  isOrphan: boolean;
  isCurrentNote: boolean;
  isUnresolved: boolean;
  pageId: string | null;
  connectionCount: number;
  size: number;
}

export interface GraphLinkEdge {
  source: string;
  target: string;
  isUnresolved: boolean;
  linkCount: number;
  thickness: number;
}

interface UseGraphDataParams {
  pages: Page[];
  focusedNoteId: string | null;
  localDepth: number;
  isLocalMode: boolean;
}

interface UseGraphDataResult {
  allNodes: GraphLinkNode[];
  allEdges: GraphLinkEdge[];
  nodes: GraphLinkNode[];
  edges: GraphLinkEdge[];
}

const WIKILINK_REGEX = /\[\[([^[\]]+)\]\]/g;
const MIN_NODE_SIZE = 10;
const MAX_NODE_SIZE = 28;
const MIN_EDGE_WIDTH = 0.5;
const MAX_EDGE_WIDTH = 1.5;

type RawReference = {
  pageId?: string;
  title?: string;
};

function normalizeLinkTarget(value: string) {
  return value
    .split("|")[0]
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function readLinkTitle(value: string) {
  return value.split("|")[0].trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function scaleValue(value: number, maxValue: number, min: number, max: number) {
  if (maxValue <= 0) {
    return min;
  }

  return Math.round(min + ((max - min) * value) / maxValue);
}

function collectReferences(value: unknown, references: RawReference[]) {
  if (value == null) {
    return;
  }

  if (typeof value === "string") {
    for (const match of value.matchAll(WIKILINK_REGEX)) {
      references.push({ title: readLinkTitle(match[1]) });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectReferences(item, references));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.text === "string") {
    for (const match of record.text.matchAll(WIKILINK_REGEX)) {
      references.push({ title: readLinkTitle(match[1]) });
    }
  }

  if (record.type === "pageLink" && record.attrs && typeof record.attrs === "object") {
    const attrs = record.attrs as Record<string, unknown>;
    references.push({
      pageId: typeof attrs.pageId === "string" ? attrs.pageId : undefined,
      title: typeof attrs.pageTitle === "string" ? attrs.pageTitle : undefined,
    });
  }

  if (Array.isArray(record.marks)) {
    for (const mark of record.marks) {
      if (!mark || typeof mark !== "object") {
        continue;
      }

      const markRecord = mark as Record<string, unknown>;
      if (markRecord.type !== "pageLinkMark" || !markRecord.attrs || typeof markRecord.attrs !== "object") {
        continue;
      }

      const attrs = markRecord.attrs as Record<string, unknown>;
      references.push({
        pageId: typeof attrs.pageId === "string" ? attrs.pageId : undefined,
      });
    }
  }

  Object.values(record).forEach((child) => {
    if (child !== record.text) {
      collectReferences(child, references);
    }
  });
}

function createGraphFromPages(pages: Page[], focusedNoteId: string | null) {
  const nodeMap = new Map<string, GraphLinkNode>();
  const edgeWeights = new Map<string, number>();
  const titleToPageId = new Map<string, string>();
  const pageIds = new Set<string>();
  const unresolvedLabels = new Map<string, string>();
  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();

  pages.forEach((page) => {
    pageIds.add(page.id);
    titleToPageId.set(normalizeLinkTarget(page.title), page.id);
  });

  pages.forEach((page) => {
    nodeMap.set(page.id, {
      id: page.id,
      label: page.title || "Untitled",
      backlinkCount: 0,
      isOrphan: true,
      isCurrentNote: page.id === focusedNoteId,
      isUnresolved: false,
      pageId: page.id,
      connectionCount: 0,
      size: MIN_NODE_SIZE,
    });
  });

  const addEdge = (sourceId: string, targetId: string, isUnresolved: boolean) => {
    if (sourceId === targetId) {
      return;
    }

    const key = `${sourceId}::${targetId}`;
    edgeWeights.set(key, (edgeWeights.get(key) ?? 0) + 1);
    outgoingCounts.set(sourceId, (outgoingCounts.get(sourceId) ?? 0) + 1);
    incomingCounts.set(targetId, (incomingCounts.get(targetId) ?? 0) + 1);

    if (isUnresolved && !nodeMap.has(targetId)) {
      nodeMap.set(targetId, {
        id: targetId,
        label: unresolvedLabels.get(targetId) ?? "Untitled",
        backlinkCount: 0,
        isOrphan: false,
        isCurrentNote: targetId === focusedNoteId,
        isUnresolved: true,
        pageId: null,
        connectionCount: 0,
        size: MIN_NODE_SIZE,
      });
    }
  };

  pages.forEach((page) => {
    const references: RawReference[] = [];
    collectReferences(page.content, references);

    if (page.parentId && pageIds.has(page.parentId)) {
      addEdge(page.parentId, page.id, false);
    }

    references.forEach((reference) => {
      let targetId: string | undefined;
      let isUnresolved = false;

      if (reference.pageId && pageIds.has(reference.pageId)) {
        targetId = reference.pageId;
      } else if (reference.title) {
        const normalizedTitle = normalizeLinkTarget(reference.title);
        targetId = titleToPageId.get(normalizedTitle);

        if (!targetId) {
          isUnresolved = true;
          targetId = `unresolved:${normalizedTitle}`;
          unresolvedLabels.set(targetId, reference.title);
        }
      }

      if (targetId) {
        addEdge(page.id, targetId, isUnresolved);
      }
    });
  });

  const maxConnectionCount = Math.max(
    0,
    ...Array.from(nodeMap.keys()).map((nodeId) => {
      const incoming = incomingCounts.get(nodeId) ?? 0;
      const outgoing = outgoingCounts.get(nodeId) ?? 0;
      return incoming + outgoing;
    })
  );
  const maxEdgeWeight = Math.max(0, ...Array.from(edgeWeights.values()));

  const allNodes = Array.from(nodeMap.values()).map((node) => {
    const incoming = incomingCounts.get(node.id) ?? 0;
    const outgoing = outgoingCounts.get(node.id) ?? 0;
    const connectionCount = incoming + outgoing;

    return {
      ...node,
      backlinkCount: incoming,
      connectionCount,
      isOrphan: connectionCount === 0,
      size: scaleValue(connectionCount, maxConnectionCount, MIN_NODE_SIZE, MAX_NODE_SIZE),
    };
  });

  const allEdges = Array.from(edgeWeights.entries()).map(([key, linkCount]) => {
    const [source, target] = key.split("::");
    return {
      source,
      target,
      isUnresolved: target.startsWith("unresolved:"),
      linkCount,
      thickness: scaleValue(linkCount, maxEdgeWeight, MIN_EDGE_WIDTH, MAX_EDGE_WIDTH),
    };
  });

  return {
    allNodes,
    allEdges,
  };
}

function filterLocalGraph(
  nodes: GraphLinkNode[],
  edges: GraphLinkEdge[],
  focusedNoteId: string | null,
  localDepth: number
) {
  if (!focusedNoteId) {
    return { nodes, edges };
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  if (!nodeMap.has(focusedNoteId)) {
    return { nodes, edges };
  }

  const adjacency = new Map<string, Set<string>>();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  const visible = new Set<string>([focusedNoteId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: focusedNoteId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= localDepth) {
      continue;
    }

    for (const nextId of adjacency.get(current.id) ?? []) {
      if (visible.has(nextId)) {
        continue;
      }

      visible.add(nextId);
      queue.push({ id: nextId, depth: current.depth + 1 });
    }
  }

  return {
    nodes: nodes.filter((node) => visible.has(node.id)),
    edges: edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target)),
  };
}

export function useGraphData({
  pages,
  focusedNoteId,
  localDepth,
  isLocalMode,
}: UseGraphDataParams): UseGraphDataResult {
  const parsed = useMemo(
    () => createGraphFromPages(pages, focusedNoteId),
    [pages, focusedNoteId]
  );

  const filtered = useMemo(() => {
    if (!isLocalMode) {
      return {
        nodes: parsed.allNodes,
        edges: parsed.allEdges,
      };
    }

    return filterLocalGraph(parsed.allNodes, parsed.allEdges, focusedNoteId, clamp(localDepth, 1, 4));
  }, [parsed, focusedNoteId, localDepth, isLocalMode]);

  return {
    allNodes: parsed.allNodes,
    allEdges: parsed.allEdges,
    nodes: filtered.nodes,
    edges: filtered.edges,
  };
}
