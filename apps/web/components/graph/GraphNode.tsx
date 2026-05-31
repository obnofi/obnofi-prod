"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GraphLinkNode } from "@/components/graph/useGraphData";

export type GraphCanvasNodeData = GraphLinkNode;

export const GraphNode = memo(function GraphNode({
  data,
  selected,
  dragging,
}: NodeProps) {
  const nodeData = data as GraphCanvasNodeData;
  const size = typeof nodeData.size === "number" ? nodeData.size : 12;

  const fillColor = nodeData.isCurrentNote
    ? "var(--color-accent)"
    : nodeData.isOrphan
    ? "rgba(100, 100, 100, 0.3)"
    : "rgba(160, 160, 160, 0.65)";

  const glowColor = nodeData.isCurrentNote
    ? "rgba(46, 125, 69, 0.25)"
    : "rgba(180, 180, 180, 0.15)";

  return (
    <div
      className="group relative cursor-pointer"
      style={{ width: size, height: size, overflow: "visible" }}
      title={nodeData.label}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-1 !w-1 !border-0 !bg-transparent opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-1 !w-1 !border-0 !bg-transparent opacity-0"
      />

      <div
        className={`rounded-full transition-all ease-out group-hover:scale-[1.8] ${
          dragging ? "duration-75" : "duration-300"
        }`}
        style={{
          width: size,
          height: size,
          backgroundColor: nodeData.isUnresolved ? "transparent" : fillColor,
          border: nodeData.isUnresolved
            ? `1px dashed rgba(130, 130, 130, 0.4)`
            : "none",
          boxShadow:
            selected
              ? `0 0 0 ${Math.round(size * 0.8)}px ${glowColor}, 0 0 0 ${Math.round(size * 0.3)}px ${fillColor}44`
              : dragging
              ? `0 0 0 ${Math.round(size)}px rgba(200, 200, 200, 0.15)`
              : nodeData.isCurrentNote
              ? `0 0 ${size * 1.5}px ${glowColor}`
              : undefined,
          transform: selected ? "scale(1.8)" : dragging ? "scale(1.5)" : undefined,
          animation: "graphNodeAppear 0.5s cubic-bezier(0.22,1,0.36,1) both",
          willChange: "transform",
          cursor: dragging ? "grabbing" : "grab",
        }}
      />

      <div
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 text-center transition-all duration-150 ease-out ${
          nodeData.isCurrentNote
            ? "opacity-90"
            : "opacity-0 group-hover:opacity-80"
        }`}
        style={{ top: size + 4 }}
      >
        <span
          className="block max-w-[100px] truncate whitespace-nowrap rounded px-1 text-[10px] font-medium leading-none"
          style={{
            color: nodeData.isCurrentNote
              ? "var(--color-text-primary)"
              : "var(--color-text-secondary)",
            background: "var(--color-background)",
            backdropFilter: "blur(4px)",
          }}
        >
          {nodeData.label}
        </span>
      </div>
    </div>
  );
});
