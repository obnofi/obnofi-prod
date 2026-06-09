"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MarkerType,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import type { GraphCanvasNodeData } from "@/components/graph/GraphNode";
import type { GraphLinkEdge, GraphLinkNode } from "@/components/graph/useGraphData";
import type { GraphEdgeKind } from "@/lib/graph/graphDataUtils";
import { useGraphStore } from "@/components/graph/graphStore";
import { useGraphSimulation } from "@/components/graph/useGraphSimulation";
import { createGraphSeedPosition } from "@/lib/graph/graphLayout";

type GraphFlowNode = Node<GraphCanvasNodeData, "graphNode">;
type GraphFlowEdge = Edge<{
  thickness: number;
  isUnresolved: boolean;
  isActive: boolean;
  isDimmed: boolean;
  kind: GraphEdgeKind;
}, "graphEdge">;

interface UseGraphFlowNodesParams {
  workspaceId: string;
  graphKey: string;
  graphNodes: GraphLinkNode[];
  graphEdges: GraphLinkEdge[];
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export function useGraphFlowNodes({
  workspaceId,
  graphKey,
  graphNodes,
  graphEdges,
}: UseGraphFlowNodesParams) {
  const router = useRouter();
  const setFocusedNote = useGraphStore((state) => state.setFocusedNote);
  const pinnedNoteId = useGraphStore((state) => state.pinnedNoteId);
  const setPinnedNote = useGraphStore((state) => state.setPinnedNote);
  const searchQuery = useGraphStore((state) => state.searchQuery);
  const labelMode = useGraphStore((state) => state.labelMode);
  const showArrows = useGraphStore((state) => state.showArrows);
  const forces = useGraphStore((state) => state.forces);

  const [nodes, setNodes, onNodesChange] = useNodesState<GraphFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphFlowEdge>([]);
  const savedPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // hover가 우선, 없으면 클릭으로 고정한 노드를 강조 기준으로 사용한다.
  const activeNodeId = hoveredNodeId ?? pinnedNoteId;

  const connectedNodeIdsByNode = useMemo(() => {
    const connectionMap = new Map<string, Set<string>>();

    graphEdges.forEach((edge) => {
      if (!connectionMap.has(edge.source)) {
        connectionMap.set(edge.source, new Set());
      }
      if (!connectionMap.has(edge.target)) {
        connectionMap.set(edge.target, new Set());
      }
      connectionMap.get(edge.source)?.add(edge.target);
      connectionMap.get(edge.target)?.add(edge.source);
    });

    return connectionMap;
  }, [graphEdges]);

  const highlightedNodeIds = useMemo(() => {
    if (!activeNodeId) {
      return new Set<string>();
    }

    const connectedIds = connectedNodeIdsByNode.get(activeNodeId);
    return new Set([activeNodeId, ...(connectedIds ? [...connectedIds] : [])]);
  }, [connectedNodeIdsByNode, activeNodeId]);

  const normalizedQuery = normalizeQuery(searchQuery);
  const searchActive = normalizedQuery.length > 0;

  const searchMatchIds = useMemo(() => {
    if (!searchActive) {
      return new Set<string>();
    }
    const matches = new Set<string>();
    graphNodes.forEach((node) => {
      if (node.label.toLowerCase().includes(normalizedQuery)) {
        matches.add(node.id);
      }
    });
    return matches;
  }, [graphNodes, normalizedQuery, searchActive]);

  useEffect(() => {
    savedPositionsRef.current = new Map(
      nodes.map((node) => [node.id, { ...node.position }])
    );
  }, [nodes]);

  useEffect(() => {
    const nextNodes: GraphFlowNode[] = graphNodes.map((node, index, allNodes) => {
      const savedPosition = savedPositionsRef.current.get(node.id);
      const isSearchMatch = searchMatchIds.has(node.id);
      const isHighlightDimmed =
        highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id);
      const isSearchDimmed = searchActive && !isSearchMatch;

      return {
        id: node.id,
        type: "graphNode",
        position: savedPosition ?? createGraphSeedPosition(index, allNodes.length),
        data: {
          ...node,
          size: node.size,
          isHovered: node.id === hoveredNodeId,
          isPinned: node.id === pinnedNoteId,
          isConnected:
            highlightedNodeIds.has(node.id) && node.id !== activeNodeId,
          isDimmed: isHighlightDimmed || isSearchDimmed,
          isSearchMatch,
          searchActive,
          labelMode,
        },
      };
    });

    const nextEdges: GraphFlowEdge[] = graphEdges.map((edge) => {
      const touchesActive =
        activeNodeId != null &&
        (edge.source === activeNodeId || edge.target === activeNodeId);
      const highlightDimmed =
        highlightedNodeIds.size > 0 && !touchesActive;
      const searchDimmed =
        searchActive &&
        !(searchMatchIds.has(edge.source) && searchMatchIds.has(edge.target));

      return {
        id: `${edge.source}->${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: "graphEdge",
        selectable: false,
        markerEnd: showArrows
          ? { type: MarkerType.ArrowClosed, width: 14, height: 14 }
          : undefined,
        data: {
          thickness: edge.thickness,
          isUnresolved: edge.isUnresolved,
          kind: edge.kind,
          isActive: touchesActive,
          isDimmed: highlightDimmed || searchDimmed,
        },
        zIndex: -1,
      };
    });

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [
    graphEdges,
    graphNodes,
    highlightedNodeIds,
    hoveredNodeId,
    pinnedNoteId,
    activeNodeId,
    searchActive,
    searchMatchIds,
    labelMode,
    showArrows,
    setEdges,
    setNodes,
  ]);

  useGraphSimulation({ nodes, edges, graphKey, setNodes, forces });

  const handleNodeClick = useCallback<NodeMouseHandler<GraphFlowNode>>(
    (_event, node) => {
      setFocusedNote(node.id);
      // 같은 노드를 다시 클릭하면 고정 해제(토글).
      setPinnedNote(node.id === pinnedNoteId ? null : node.id);
    },
    [setFocusedNote, setPinnedNote, pinnedNoteId]
  );

  const handleNodeDoubleClick = useCallback<NodeMouseHandler<GraphFlowNode>>(
    (_event, node) => {
      const nextId = node.data.pageId;

      if (!nextId) {
        return;
      }

      router.push(`/workspace/${workspaceId}?page=${nextId}`);
    },
    [router, workspaceId]
  );

  const handleNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: GraphFlowNode) => {
      setHoveredNodeId(node.id);
      setNodes((current) =>
        current.map((n) => (n.id === node.id ? { ...n, dragging: true } : n))
      );
    },
    [setNodes]
  );

  const handleNodeDrag = useCallback(
    (_event: React.MouseEvent, node: GraphFlowNode) => {
      setNodes((current) =>
        current.map((n) =>
          n.id === node.id ? { ...n, position: node.position, dragging: true } : n
        )
      );
    },
    [setNodes]
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: GraphFlowNode) => {
      setNodes((current) =>
        current.map((n) => (n.id === node.id ? { ...n, dragging: false } : n))
      );
      savedPositionsRef.current.set(node.id, { ...node.position });
      setHoveredNodeId(node.id);
    },
    [setNodes]
  );

  const handleNodeMouseEnter = useCallback<NodeMouseHandler<GraphFlowNode>>(
    (_event, node) => {
      setHoveredNodeId(node.id);
    },
    []
  );

  const handleNodeMouseLeave = useCallback<NodeMouseHandler<GraphFlowNode>>(() => {
    setHoveredNodeId(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setHoveredNodeId(null);
    setPinnedNote(null);
  }, [setPinnedNote]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleNodeClick,
    handleNodeDoubleClick,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    handlePaneClick,
  };
}
