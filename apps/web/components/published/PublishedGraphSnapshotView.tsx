"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import { GraphEdge } from "@/components/graph/GraphEdge";
import { GraphNode, type GraphCanvasNodeData } from "@/components/graph/GraphNode";
import { createGraphSeedPosition } from "@/lib/graph/graphLayout";
import { useGraphSimulation } from "@/components/graph/useGraphSimulation";
import type { PublishedGraphSnapshotContent } from "@/lib/publishedPageTypes";

type GraphFlowNode = Node<GraphCanvasNodeData, "graphNode">;
type GraphFlowEdge = Edge<{ thickness: number; isUnresolved: boolean }, "graphEdge">;

const nodeTypes: NodeTypes = { graphNode: GraphNode };
const edgeTypes: EdgeTypes = { graphEdge: GraphEdge };

function PublishedGraphSnapshotCanvas({
  snapshot,
}: {
  snapshot: PublishedGraphSnapshotContent;
}) {
  const { fitView } = useReactFlow();
  const graphKey = useMemo(
    () => `${snapshot.nodes.length}:${snapshot.edges.length}:${snapshot.focusedPageId ?? "none"}`,
    [snapshot.edges.length, snapshot.focusedPageId, snapshot.nodes.length]
  );

  const initialNodes = useMemo(
    () =>
      snapshot.nodes.map((node, index, allNodes) => ({
        id: String(node.id),
        type: "graphNode" as const,
        position: createGraphSeedPosition(index, allNodes.length),
        data: node as GraphCanvasNodeData,
      })),
    [snapshot.nodes]
  );
  const initialEdges = useMemo(
    () =>
      snapshot.edges.map((edge) => ({
        id: `${String(edge.source)}->${String(edge.target)}`,
        source: String(edge.source),
        target: String(edge.target),
        type: "graphEdge" as const,
        selectable: false,
        data: {
          thickness: Number(edge.thickness ?? 0.8),
          isUnresolved: Boolean(edge.isUnresolved),
        },
        zIndex: -1,
      })),
    [snapshot.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<GraphFlowNode>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState<GraphFlowEdge>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useGraphSimulation({ nodes, edges, graphKey, setNodes });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fitView({ padding: 0.2, duration: 280 });
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [fitView, graphKey]);

  return (
    <div className="h-[620px] overflow-hidden rounded-2xl bg-[var(--color-surface)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag
        minZoom={0.1}
        maxZoom={1.8}
        fitView
      >
        <MiniMap pannable zoomable className="!bg-[var(--color-surface)]" />
        <Controls showInteractive={false} />
        <Background gap={28} size={0.7} color="var(--color-border)" />
      </ReactFlow>
    </div>
  );
}

export function PublishedGraphSnapshotView({
  snapshot,
}: {
  snapshot: PublishedGraphSnapshotContent;
}) {
  return (
    <ReactFlowProvider>
      <PublishedGraphSnapshotCanvas snapshot={snapshot} />
    </ReactFlowProvider>
  );
}
