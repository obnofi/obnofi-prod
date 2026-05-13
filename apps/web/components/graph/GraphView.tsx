"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Background,
  Controls,
  MiniMap,
  type Node as ReactFlowNode,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, Orbit } from "lucide-react";
import type { Page } from "@obnofi/types";
import { GraphNode, type GraphCanvasNodeData } from "@/components/graph/GraphNode";
import { GraphEdge } from "@/components/graph/GraphEdge";
import { useGraphStore } from "@/components/graph/graphStore";
import { useGraphData } from "@/components/graph/useGraphData";
import { useGraphSimulation } from "@/components/graph/useGraphSimulation";

interface GraphViewProps {
  workspaceId: string;
}

type GraphFlowNode = Node<GraphCanvasNodeData, "graphNode">;
type GraphFlowEdge = Edge<{ thickness: number; isUnresolved: boolean }, "graphEdge">;

const nodeTypes: NodeTypes = {
  graphNode: GraphNode,
};

const edgeTypes: EdgeTypes = {
  graphEdge: GraphEdge,
};

function GraphViewCanvas({ workspaceId }: GraphViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusedNoteId = useGraphStore((state) => state.focusedNoteId);
  const localDepth = useGraphStore((state) => state.localDepth);
  const isLocalMode = useGraphStore((state) => state.isLocalMode);
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const setFocusedNote = useGraphStore((state) => state.setFocusedNote);
  const setLocalDepth = useGraphStore((state) => state.setLocalDepth);
  const setLocalMode = useGraphStore((state) => state.setLocalMode);
  const { fitView } = useReactFlow();

  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphFlowEdge>([]);
  const savedPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const queryPageId = searchParams.get("page");

  useEffect(() => {
    if (queryPageId) {
      setFocusedNote(queryPageId);
    }
  }, [queryPageId, setFocusedNote]);

  useEffect(() => {
    let mounted = true;

    const loadPages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/pages?workspaceId=${workspaceId}&includeContent=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch graph pages");
        }

        const nextPages = (await response.json()) as Page[];
        if (!mounted) {
          return;
        }

        setPages(nextPages);
        if (!queryPageId && nextPages[0]) {
          setFocusedNote(nextPages[0].id);
        }
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Failed to load graph"
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPages();

    return () => {
      mounted = false;
    };
  }, [workspaceId, queryPageId, setFocusedNote]);

  const graphData = useGraphData({
    pages,
    focusedNoteId,
    localDepth,
    isLocalMode,
  });

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
  }, [
    graphData.allNodes.length,
    isLocalMode,
    setLocalDepth,
    setLocalMode,
  ]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    savedPositionsRef.current = new Map(
      nodes.map((node) => [node.id, { ...node.position }])
    );
  }, [nodes]);

  const graphKey = useMemo(() => {
    const nodeKey = graphData.nodes.map((node) => node.id).join("|");
    const edgeKey = graphData.edges
      .map((edge) => `${edge.source}->${edge.target}:${edge.linkCount}`)
      .join("|");
    return `${nodeKey}__${edgeKey}`;
  }, [graphData.edges, graphData.nodes]);

  useEffect(() => {
    const nextNodes: GraphFlowNode[] = graphData.nodes.map((node, index) => {
      const savedPosition = savedPositionsRef.current.get(node.id);

      return {
        id: node.id,
        type: "graphNode",
        // savedPosition이 없으면 중앙 근처 랜덤 → d3-force가 폭발적으로 퍼뜨림
        position: savedPosition ?? {
          x: (Math.random() - 0.5) * 40,
          y: (Math.random() - 0.5) * 40,
        },
        data: {
          ...node,
          size: node.size,
        },
      };
    });

    const nextEdges: GraphFlowEdge[] = graphData.edges.map((edge) => ({
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
  }, [graphData.edges, graphData.nodes, setEdges, setNodes]);

  useGraphSimulation({
    nodes,
    edges,
    graphKey,
    setNodes,
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

    if (data.isCurrentNote) {
      return "rgba(210, 210, 210, 0.9)";
    }

    if (data.isOrphan) {
      return "rgba(90, 90, 90, 0.5)";
    }

    return "rgba(140, 140, 140, 0.7)";
  }, []);

  return (
    <>
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Graph View
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {graphData.nodes.length} nodes, {graphData.edges.length} links
              </p>
            </div>
          </div>
        </div>
      </header>

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
                No pages yet
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Create a few notes with <code>[[wikilink]]</code> to grow the graph.
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
            onNodeClick={handleNodeClick}
            minZoom={0.1}
            maxZoom={1.8}
            fitView
            onlyRenderVisibleElements
            className="graph-view-flow"
          >
            <Panel
              position="top-right"
              className="m-3 flex min-w-[240px] flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 shadow-sm backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[var(--color-text-primary)]">
                  Local Graph
                </span>
                <button
                  type="button"
                  onClick={handleLocalModeToggle}
                  className="rounded-md px-2 py-1 text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                >
                  {isLocalMode ? "On" : "Off"}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={localDepth}
                  onChange={handleDepthChange}
                  disabled={!isLocalMode}
                  className="w-full accent-[var(--color-accent)] disabled:opacity-50"
                />
                <span className="w-6 text-xs text-[var(--color-text-secondary)]">
                  {localDepth}
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)]">
                {graphData.allNodes.length >= 500
                  ? "Barnes-Hut 최적화가 활성화된 레이아웃입니다."
                  : "전체 워크스페이스 링크를 표시합니다."}
              </div>
            </Panel>
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
