"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Background,
  Controls,
  MiniMap,
  type Node as ReactFlowNode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { Loader2, Orbit } from "lucide-react";
import { GraphNode, type GraphCanvasNodeData } from "@/components/graph/GraphNode";
import { GraphEdge } from "@/components/graph/GraphEdge";
import { useGraphStore } from "@/components/graph/graphStore";
import { useGraphData } from "@/components/graph/useGraphData";
import { useGraphPages } from "@/components/graph/useGraphPages";
import { useGraphFlowNodes } from "@/components/graph/useGraphFlowNodes";
import { GraphControlPanel } from "@/components/graph/GraphControlPanel";
import { GraphViewHeader } from "@/components/graph/GraphViewHeader";

interface GraphViewProps {
  workspaceId: string;
}

const nodeTypes: NodeTypes = { graphNode: GraphNode };
const edgeTypes: EdgeTypes = { graphEdge: GraphEdge };

function GraphViewCanvas({ workspaceId }: GraphViewProps) {
  const searchParams = useSearchParams();
  const focusedNoteId = useGraphStore((state) => state.focusedNoteId);
  const localDepth = useGraphStore((state) => state.localDepth);
  const isLocalMode = useGraphStore((state) => state.isLocalMode);
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const setFocusedNote = useGraphStore((state) => state.setFocusedNote);
  const setLocalDepth = useGraphStore((state) => state.setLocalDepth);
  const setLocalMode = useGraphStore((state) => state.setLocalMode);
  const { fitView } = useReactFlow();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const queryPageId = searchParams.get("page");

  useEffect(() => {
    if (queryPageId) {
      setFocusedNote(queryPageId);
    }
  }, [queryPageId, setFocusedNote]);

  const { pages, isLoading, error } = useGraphPages(workspaceId, queryPageId, setFocusedNote);

  const graphData = useGraphData({ pages, focusedNoteId, localDepth, isLocalMode });

  useEffect(() => {
    setGraphData(graphData.nodes, graphData.edges);
  }, [graphData.nodes, graphData.edges, setGraphData]);

  useEffect(() => {
    if (graphData.allNodes.length <= 2000 || isLocalMode) {
      return;
    }
    setLocalMode(true);
    setLocalDepth(2);
    setToastMessage("노드가 2000개를 넘어 로컬 그래프로 자동 전환했습니다.");
  }, [graphData.allNodes.length, isLocalMode, setLocalDepth, setLocalMode]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const graphKey = useMemo(() => {
    const nodeKey = graphData.nodes.map((node) => node.id).join("|");
    const edgeKey = graphData.edges
      .map((edge) => `${edge.source}->${edge.target}:${edge.linkCount}`)
      .join("|");
    return `${nodeKey}__${edgeKey}`;
  }, [graphData.edges, graphData.nodes]);

  const {
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
  } = useGraphFlowNodes({
    workspaceId,
    graphKey,
    graphNodes: graphData.nodes,
    graphEdges: graphData.edges,
  });

  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }
    const timeout = window.setTimeout(() => {
      void fitView({ padding: 0.2, duration: 280 });
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [fitView, graphKey, nodes.length]);

  const handleLocalModeToggle = useCallback(() => {
    setLocalMode(!isLocalMode);
  }, [isLocalMode, setLocalMode]);

  const handleDepthChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLocalDepth(Number(event.target.value));
    },
    [setLocalDepth]
  );

  const minimapNodeColor = useCallback((node: ReactFlowNode) => {
    const data = node.data as GraphCanvasNodeData;
    if (data.isCurrentNote) return "rgba(210, 210, 210, 0.9)";
    if (data.isOrphan) return "rgba(90, 90, 90, 0.5)";
    return "rgba(140, 140, 140, 0.7)";
  }, []);

  return (
    <>
      <GraphViewHeader
        workspaceId={workspaceId}
        queryPageId={queryPageId}
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.edges.length}
      />

      <main className="relative flex-1 overflow-hidden bg-[var(--color-background)]">
        {toastMessage ? (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[10000] -translate-x-1/2 rounded-lg bg-[var(--color-tooltip-bg)] px-3 py-2 text-xs text-white shadow-lg">
            {toastMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : graphData.allNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
                <Orbit className="h-6 w-6 text-[var(--color-text-placeholder)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                아직 페이지가 없어요
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                <code>{"[[위키링크]]"}</code>로 노트를 몇 개 만들어 그래프를 키워보세요.
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={handleNodeDrag}
            onNodeDragStop={handleNodeDragStop}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onPaneClick={handlePaneClick}
            minZoom={0.1}
            maxZoom={1.8}
            fitView
            onlyRenderVisibleElements
            className="graph-view-flow"
          >
            <GraphControlPanel
              isLocalMode={isLocalMode}
              localDepth={localDepth}
              allNodesCount={graphData.allNodes.length}
              onLocalModeToggle={handleLocalModeToggle}
              onDepthChange={handleDepthChange}
            />
            <MiniMap
              pannable
              zoomable
              nodeStrokeWidth={0}
              className="!bg-[var(--color-surface)]"
              nodeColor={minimapNodeColor}
            />
            <Controls />
            <Background gap={28} size={0.7} color="var(--color-border)" />
          </ReactFlow>
        )}
      </main>
    </>
  );
}

export function GraphView({ workspaceId }: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewCanvas workspaceId={workspaceId} />
    </ReactFlowProvider>
  );
}

export { GraphViewCanvas };
