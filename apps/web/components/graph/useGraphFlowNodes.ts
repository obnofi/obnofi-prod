"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import type { GraphCanvasNodeData } from "@/components/graph/GraphNode";
import type { GraphLinkEdge, GraphLinkNode } from "@/components/graph/useGraphData";
import { useGraphStore } from "@/components/graph/graphStore";
import { useGraphSimulation } from "@/components/graph/useGraphSimulation";
import { createGraphSeedPosition } from "@/lib/graph/graphLayout";

type GraphFlowNode = Node<GraphCanvasNodeData, "graphNode">;
type GraphFlowEdge = Edge<{
  thickness: number;
  isUnresolved: boolean;
  isActive: boolean;
  isDimmed: boolean;
}, "graphEdge">;

interface UseGraphFlowNodesParams {
  workspaceId: string;
  graphKey: string;
  graphNodes: GraphLinkNode[];
  graphEdges: GraphLinkEdge[];
}

export function useGraphFlowNodes({
  workspaceId,
  graphKey,
  graphNodes,
  graphEdges,
}: UseGraphFlowNodesParams) {
  const router = useRouter();
  const setFocusedNote = useGraphStore((state) => state.setFocusedNote);
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphFlowEdge>([]);
  const savedPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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
    if (!hoveredNodeId) {
      return new Set<string>();
    }

    const connectedIds = connectedNodeIdsByNode.get(hoveredNodeId);
    return new Set([hoveredNodeId, ...(connectedIds ? [...connectedIds] : [])]);
  }, [connectedNodeIdsByNode, hoveredNodeId]);

  useEffect(() => {
    savedPositionsRef.current = new Map(
      nodes.map((node) => [node.id, { ...node.position }])
    );
  }, [nodes]);

  useEffect(() => {
    const nextNodes: GraphFlowNode[] = graphNodes.map((node, index, allNodes) => {
      const savedPosition = savedPositionsRef.current.get(node.id);

      return {
        id: node.id,
        type: "graphNode",
        position: savedPosition ?? createGraphSeedPosition(index, allNodes.length),
        data: {
          ...node,
          size: node.size,
          isHovered: node.id === hoveredNodeId,
          isConnected: highlightedNodeIds.has(node.id) && node.id !== hoveredNodeId,
          isDimmed: highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id),
        },
      };
    });

    const nextEdges: GraphFlowEdge[] = graphEdges.map((edge) => ({
      id: `${edge.source}->${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: "graphEdge",
      selectable: false,
      data: {
        thickness: edge.thickness,
        isUnresolved: edge.isUnresolved,
        isActive:
          hoveredNodeId != null &&
          (edge.source === hoveredNodeId || edge.target === hoveredNodeId),
        isDimmed:
          highlightedNodeIds.size > 0 &&
          edge.source !== hoveredNodeId &&
          edge.target !== hoveredNodeId,
      },
      zIndex: -1,
    }));

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [graphEdges, graphNodes, highlightedNodeIds, hoveredNodeId, setEdges, setNodes]);

  useGraphSimulation({ nodes, edges, graphKey, setNodes });

  const handleNodeClick = useCallback<NodeMouseHandler<GraphFlowNode>>(
    (_event, node) => {
      setFocusedNote(node.id);
    },
    [setFocusedNote]
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
  }, []);

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
