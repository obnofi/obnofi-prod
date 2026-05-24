"use client";

import { useCallback, useEffect, useRef } from "react";
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
type GraphFlowEdge = Edge<{ thickness: number; isUnresolved: boolean }, "graphEdge">;

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
      },
      zIndex: -1,
    }));

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [graphEdges, graphNodes, setEdges, setNodes]);

  useGraphSimulation({ nodes, edges, graphKey, setNodes });

  const handleNodeClick = useCallback<NodeMouseHandler<GraphFlowNode>>(
    (_event, node) => {
      const nextId = node.data.pageId;
      setFocusedNote(node.id);

      if (!nextId) {
        return;
      }

      router.push(`/workspace/${workspaceId}?page=${nextId}`);
    },
    [router, setFocusedNote, workspaceId]
  );

  const handleNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: GraphFlowNode) => {
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
    },
    [setNodes]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleNodeClick,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
  };
}
