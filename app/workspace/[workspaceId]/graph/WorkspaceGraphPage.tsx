"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  addEdge,
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  useEdgesState,
  useNodesState,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Loader2, Orbit, Plus, Trash2 } from "lucide-react";
import { CustomNoteNode } from "@/components/graph/CustomNoteNode";
import { CustomDatabaseNode } from "@/components/graph/CustomDatabaseNode";
import { DatabaseViewModal } from "@/components/database/DatabaseViewModal";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { buildGraphData, type GraphEdge, type GraphNode } from "@/lib/graph-utils";
import { Page } from "@/types";

interface WorkspaceGraphPageProps {
  workspaceId: string;
}

const nodeTypes: NodeTypes = {
  customNote: CustomNoteNode,
  customDatabase: CustomDatabaseNode,
};

function WorkspaceGraphCanvas({ workspaceId }: WorkspaceGraphPageProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);

  useEffect(() => {
    let isMounted = true;

    const loadPages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch pages");
        }

        const data = (await response.json()) as Page[];
        if (isMounted) {
          setPages(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Unknown error"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPages();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    const graph = buildGraphData(pages);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [pages, setEdges, setNodes]);

  const onConnect = useCallback<OnConnect>(
    (connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      setEdges((currentEdges) => {
        const exists = currentEdges.some(
          (edge) =>
            edge.source === connection.source && edge.target === connection.target
        );

        if (exists) {
          return currentEdges;
        }

        return addEdge(
          {
            ...connection,
            id: `${connection.source}-${connection.target}-${Date.now()}`,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#2E7D45", strokeWidth: 1.5 },
          },
          currentEdges
        );
      });
    },
    [setEdges]
  );

  const handleAutoLayout = useCallback(() => {
    const graph = buildGraphData(pages);
    setNodes(graph.nodes);
  }, [pages, setNodes]);

  const handleClearManualEdges = useCallback(() => {
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => !edge.animated)
    );
  }, [setEdges]);

  return (
    <div data-testid="workspace-graph-page" className="flex h-screen bg-white dark:bg-[#111110]">
      <Sidebar workspaceId={workspaceId} />

      <div className="flex-1 overflow-hidden">
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              href={`/workspace/${workspaceId}`}
              data-testid="graph-back-link"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </Link>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#2E7D45]/10 p-2 text-[#2E7D45]">
                <Orbit className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#111110] dark:text-zinc-100">
                  Graph View
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {pages.length} pages, {edges.length} links
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="h-[calc(100vh-61px)]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6 text-sm text-red-500">
              {error}
            </div>
          ) : pages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  <Orbit className="h-6 w-6 text-zinc-400" />
                </div>
                <h2 className="text-lg font-semibold text-[#111110] dark:text-zinc-100">
                  No pages yet
                </h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Create a few notes with <code>[[Wiki Links]]</code> to see the graph.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={1.5}
                nodesDraggable
                nodesConnectable
                elementsSelectable
                deleteKeyCode={["Backspace", "Delete"]}
                connectionLineType={ConnectionLineType.SmoothStep}
                defaultEdgeOptions={{
                  animated: false,
                  style: { stroke: "#94a3b8", strokeWidth: 1.25 },
                }}
                className="bg-[radial-gradient(circle_at_top,_rgba(46,125,69,0.08),_transparent_35%),linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(46,125,69,0.12),_transparent_35%),linear-gradient(180deg,rgba(20,20,20,1)_0%,rgba(17,17,16,1)_100%)]"
              >
                <Panel
                  position="top-right"
                  className="m-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90"
                >
                  <button
                    type="button"
                    onClick={handleAutoLayout}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Reset layout
                  </button>
                  <button
                    type="button"
                    onClick={handleClearManualEdges}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear manual links
                  </button>
                </Panel>
                <MiniMap
                  pannable
                  zoomable
                  className="!bg-white dark:!bg-zinc-900"
                  nodeColor={() => "#2E7D45"}
                />
                <Controls />
                <Background gap={24} size={1} color="#d4d4d8" />
              </ReactFlow>
              <DatabaseViewModal />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function WorkspaceGraphPage({ workspaceId }: WorkspaceGraphPageProps) {
  return (
    <ReactFlowProvider>
      <WorkspaceGraphCanvas workspaceId={workspaceId} />
    </ReactFlowProvider>
  );
}
