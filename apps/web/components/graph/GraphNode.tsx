"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GraphLinkNode } from "@/components/graph/useGraphData";

export type GraphCanvasNodeData = GraphLinkNode & {
  isHovered?: boolean;
  isConnected?: boolean;
  isDimmed?: boolean;
};

export const GraphNode = memo(function GraphNode({
  data,
  selected,
  dragging,
}: NodeProps) {
  const nodeData = data as GraphCanvasNodeData;
  const size = typeof nodeData.size === "number" ? nodeData.size : 16;
  const isInteractiveFocus =
    selected || dragging || nodeData.isHovered || nodeData.isCurrentNote;
  const labelVisible = isInteractiveFocus || nodeData.isConnected;

  const fillColor = nodeData.isCurrentNote
    ? "var(--color-accent)"
    : nodeData.isHovered
    ? "rgba(75, 75, 75, 0.92)"
    : nodeData.isConnected
    ? "rgba(120, 120, 120, 0.82)"
    : nodeData.isOrphan
    ? "rgba(100, 100, 100, 0.3)"
    : "rgba(160, 160, 160, 0.65)";

  const glowColor = nodeData.isCurrentNote
    ? "rgba(46, 125, 69, 0.25)"
    : nodeData.isHovered
    ? "rgba(110, 110, 110, 0.2)"
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
        className={`rounded-full transition-all ease-out ${
          dragging ? "duration-75" : "duration-300"
        }`}
        style={{
          width: size,
          height: size,
          backgroundColor: nodeData.isUnresolved ? "transparent" : fillColor,
          border: nodeData.isUnresolved
            ? `1px dashed rgba(130, 130, 130, 0.4)`
            : "none",
          opacity: nodeData.isDimmed ? 0.3 : 1,
          boxShadow:
            isInteractiveFocus
              ? `0 0 0 ${Math.round(size * 0.8)}px ${glowColor}, 0 0 0 ${Math.round(size * 0.3)}px ${fillColor}33`
              : dragging
              ? `0 0 0 ${Math.round(size)}px rgba(200, 200, 200, 0.15)`
              : nodeData.isCurrentNote
              ? `0 0 ${size * 1.5}px ${glowColor}`
              : undefined,
          transform: selected
            ? "scale(1.22)"
            : dragging
            ? "scale(1.16)"
            : nodeData.isHovered
            ? "scale(1.14)"
            : nodeData.isConnected
            ? "scale(1.06)"
            : undefined,
          animation: "graphNodeAppear 0.5s cubic-bezier(0.22,1,0.36,1) both",
          willChange: "transform",
          cursor: dragging ? "grabbing" : "grab",
        }}
      />

      <div
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 text-center transition-all duration-150 ease-out ${
          labelVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: size + 8 }}
      >
        <span
          className="block max-w-[160px] truncate whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium leading-none shadow-sm"
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
        <span className="mt-1 block text-[10px] font-medium text-[var(--color-text-placeholder)]">
          {nodeData.connectionCount} links
        </span>
      </div>
    </div>
  );
});
