"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GraphLinkNode } from "@/components/graph/useGraphData";

export type GraphCanvasNodeData = GraphLinkNode;

export const GraphNode = memo(function GraphNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = data as GraphCanvasNodeData;
  const size = typeof nodeData.size === "number" ? nodeData.size : 10;

  const fillColor = nodeData.isCurrentNote
    ? "rgba(235, 235, 235, 0.96)"
    : nodeData.isOrphan
    ? "rgba(90, 90, 90, 0.38)"
    : "rgba(148, 148, 148, 0.72)";

  const labelColor = nodeData.isCurrentNote
    ? "rgba(215, 215, 215, 0.92)"
    : "rgba(130, 130, 130, 0.72)";

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

      {/* dot */}
      <div
        className="rounded-full transition-transform duration-150 group-hover:scale-[1.5]"
        style={{
          width: size,
          height: size,
          backgroundColor: nodeData.isUnresolved ? "transparent" : fillColor,
          border: nodeData.isUnresolved
            ? `1px dashed rgba(130, 130, 130, 0.4)`
            : "none",
          boxShadow: selected
            ? `0 0 0 ${Math.round(size * 0.6)}px rgba(180, 180, 180, 0.12)`
            : undefined,
          transform: selected ? "scale(1.5)" : undefined,
          animation: "graphNodeAppear 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      />

      {/* 라벨 */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center transition-opacity duration-150 group-hover:opacity-100"
        style={{ top: size + 5, opacity: nodeData.isCurrentNote ? 0.9 : 0.65 }}
      >
        <span
          className="block max-w-[88px] truncate text-[10px] font-medium leading-none"
          style={{ color: labelColor }}
        >
          {nodeData.label}
        </span>
      </div>
    </div>
  );
});
