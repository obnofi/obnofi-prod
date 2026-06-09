"use client";

import { memo } from "react";
import {
  BaseEdge,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import type { GraphEdgeKind } from "@/lib/graph/graphDataUtils";

export const GraphEdge = memo(function GraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  data,
}: EdgeProps) {
  const edgeData = (data ?? {}) as {
    thickness?: number;
    isUnresolved?: boolean;
    isActive?: boolean;
    isDimmed?: boolean;
    kind?: GraphEdgeKind;
  };

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  const isEmbed = edgeData.kind === "embed";
  const isHierarchy = edgeData.kind === "hierarchy";

  const baseColor = edgeData.isActive
    ? "var(--color-accent)"
    : isEmbed
      ? "var(--color-text-secondary)"
      : "var(--color-text-placeholder)";

  const dash = edgeData.isUnresolved
    ? "4 4"
    : isEmbed
      ? "2 3"
      : undefined;

  const baseWidth = edgeData.thickness ?? 1;
  const widthScale = edgeData.isActive ? 1.5 : isHierarchy ? 0.6 : 0.8;

  const opacity = edgeData.isDimmed
    ? 0.08
    : edgeData.isUnresolved
      ? 0.4
      : edgeData.isActive
        ? 0.85
        : isHierarchy
          ? 0.4
          : 0.62;

  return (
    <BaseEdge
      id={String(id)}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: baseColor,
        strokeWidth: baseWidth * widthScale,
        strokeDasharray: dash,
        opacity,
        animation: "graphEdgeFadeIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s backwards",
      }}
    />
  );
});
