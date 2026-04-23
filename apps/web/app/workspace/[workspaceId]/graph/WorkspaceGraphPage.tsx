"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { buildGraphData, type GraphEdge, type GraphNode } from "@/lib/graph-utils";
import { Page } from "@obnofi/types";

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
            type: "default",
            animated: false,
            style: { stroke: "#2E7D45", strokeWidth: 1.15, opacity: 0.65 },
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
    <>
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 bg-[var(--color-background)]">
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace/${workspaceId}`}
            data-testid="graph-back-link"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[var(--color-accent-subtle)] p-2 text-[var(--color-accent)]">
              <Orbit className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Graph View
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {nodes.length} pages, {edges.length} links
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-[var(--color-background)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6 text-sm text-red-500 bg-[var(--color-background)]">
            {error}
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center bg-[var(--color-background)]">
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
                <Orbit className="h-6 w-6 text-[var(--color-text-placeholder)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                No pages yet
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
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
                style: { stroke: "#9ca3af", strokeWidth: 1, opacity: 0.55 },
              }}
              className="bg-[var(--color-background)]"
            >
              <Panel
                position="top-right"
                className="m-3 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-2 shadow-sm backdrop-blur"
              >
                <button
                  type="button"
                  onClick={handleAutoLayout}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Reset layout
                </button>
                <button
                  type="button"
                  onClick={handleClearManualEdges}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear manual links
                </button>
              </Panel>
              <MiniMap
                pannable
                zoomable
                className="!bg-[var(--color-surface)]"
                nodeColor={(node) =>
                  node.type === "customDatabase" ? "#2E7D45" : "#64748b"
                }
              />
              <Controls />
              <Background gap={28} size={0.7} color="var(--color-border)" />
            </ReactFlow>
            <DatabaseViewModal />
          </>
        )}
      </main>
    </>
  );
}

export function WorkspaceGraphPage({ workspaceId }: WorkspaceGraphPageProps) {
  return (
    <ReactFlowProvider>
      <WorkspaceGraphCanvas workspaceId={workspaceId} />
    </ReactFlowProvider>
  );
}
