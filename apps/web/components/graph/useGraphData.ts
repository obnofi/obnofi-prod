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

    return filterLocalGraph(
      parsed.allNodes,
      parsed.allEdges,
      focusedNoteId,
      clamp(localDepth, 1, 4)
    );
  }, [parsed, focusedNoteId, localDepth, isLocalMode]);

  return {
    allNodes: parsed.allNodes,
    allEdges: parsed.allEdges,
    nodes: filtered.nodes,
    edges: filtered.edges,
  };
}
