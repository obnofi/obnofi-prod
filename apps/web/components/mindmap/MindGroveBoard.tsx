"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  type ReactFlowInstance,
  MarkerType,
  Panel,
} from "@xyflow/react";
import { PlusCircle } from "lucide-react";
import { MindGroveNode } from "./MindGroveNode";

const nodeTypes: NodeTypes = { mindgrove: MindGroveNode };

const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: "var(--color-text-secondary)",
  },
  style: { stroke: "var(--color-text-secondary)", strokeWidth: 1.5 },
};

interface MindGroveBoardInnerProps {
  pageId: string;
  initialContent: object | null;
}

function MindGroveBoardInner({ pageId, initialContent }: MindGroveBoardInnerProps) {
  const content = initialContent as { nodes?: Parameters<typeof useNodesState>[0]; edges?: Parameters<typeof useEdgesState>[0] } | null;

  const [nodes, setNodes, onNodesChange] = useNodesState(content?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(content?.edges ?? []);

  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNodes = useRef(nodes);
  const latestEdges = useRef(edges);

  useEffect(() => { latestNodes.current = nodes; }, [nodes]);
  useEffect(() => { latestEdges.current = edges; }, [edges]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { nodes: latestNodes.current, edges: latestEdges.current },
        }),
      });
    }, 1500);
  }, [pageId]);

  useEffect(() => {
    scheduleSave();
  }, [nodes, edges, scheduleSave]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (canvasX?: number, canvasY?: number) => {
      const id = crypto.randomUUID();
      const viewport = rfInstance.current?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
      const x = canvasX ?? (400 - viewport.x) / viewport.zoom;
      const y = canvasY ?? (300 - viewport.y) / viewport.zoom;
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: "mindgrove",
          position: { x, y },
          data: { label: "노드" },
        },
      ]);
    },
    [setNodes]
  );

  const handlePaneDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!rfInstance.current) return;
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const { x, y, zoom } = rfInstance.current.getViewport();
      addNode((e.clientX - bounds.left - x) / zoom, (e.clientY - bounds.top - y) / zoom);
    },
    [addNode]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) => eds.filter((ed) => !ed.selected));
      }
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={(instance) => { rfInstance.current = instance; }}
      onDoubleClick={handlePaneDoubleClick}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.15}
      maxZoom={2.5}
      deleteKeyCode={null}
    >
      <Background gap={20} size={0.7} color="var(--color-border)" />
      <Controls />
      <MiniMap
        pannable
        zoomable
        className="!bg-[var(--color-surface)]"
        nodeStrokeWidth={0}
      />
      <Panel position="top-left">
        <div className="flex items-center gap-2">
          <button
            onClick={() => addNode()}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:text-[var(--color-text-primary)]"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            노드 추가
          </button>
          <span className="text-[11px] text-[var(--color-text-placeholder)]">
            빈 곳 더블클릭으로도 추가 · 노드 더블클릭으로 편집
          </span>
        </div>
      </Panel>
    </ReactFlow>
  );
}

interface MindGroveBoardProps {
  pageId: string;
  initialContent: object | null;
}

export function MindGroveBoard({ pageId, initialContent }: MindGroveBoardProps) {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <MindGroveBoardInner pageId={pageId} initialContent={initialContent} />
      </div>
    </ReactFlowProvider>
  );
}
