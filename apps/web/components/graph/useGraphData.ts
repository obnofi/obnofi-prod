"use client";

import { useMemo } from "react";
import type { Page } from "@obnofi/types";
import {
  createGraphFromPages,
  filterLocalGraph,
  clamp,
  type GraphLinkNode,
  type GraphLinkEdge,
} from "@/lib/graph/graphDataUtils";

export type { GraphLinkNode, GraphLinkEdge } from "@/lib/graph/graphDataUtils";

interface UseGraphDataParams {
  pages: Page[];
  focusedNoteId: string | null;
  localDepth: number;
  isLocalMode: boolean;
  showOrphans: boolean;
}

interface UseGraphDataResult {
  allNodes: GraphLinkNode[];
  allEdges: GraphLinkEdge[];
  nodes: GraphLinkNode[];
  edges: GraphLinkEdge[];
}

export function useGraphData({
  pages,
  focusedNoteId,
  localDepth,
  isLocalMode,
  showOrphans,
}: UseGraphDataParams): UseGraphDataResult {
  const parsed = useMemo(
    () => createGraphFromPages(pages, focusedNoteId),
    [pages, focusedNoteId]
  );

  const filtered = useMemo(() => {
    const base = !isLocalMode
      ? { nodes: parsed.allNodes, edges: parsed.allEdges }
      : filterLocalGraph(
          parsed.allNodes,
          parsed.allEdges,
          focusedNoteId,
          clamp(localDepth, 1, 4)
        );

    if (showOrphans) {
      return base;
    }

    // 고아 숨김: 연결이 없는 노드를 제거한다. 단, 현재 포커스 노드는 항상 유지.
    const nodes = base.nodes.filter(
      (node) => node.connectionCount > 0 || node.id === focusedNoteId
    );
    const visibleIds = new Set(nodes.map((node) => node.id));
    const edges = base.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
    );
    return { nodes, edges };
  }, [parsed, focusedNoteId, localDepth, isLocalMode, showOrphans]);

  return {
    allNodes: parsed.allNodes,
    allEdges: parsed.allEdges,
    nodes: filtered.nodes,
    edges: filtered.edges,
  };
}
