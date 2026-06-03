"use client";

import { memo } from "react";
import {
  BaseEdge,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";

export const GraphEdge = memo(function GraphEdge({
  id,
  source,
  target,
  data,
}: EdgeProps) {
  const edgeData = (data ?? {}) as {
    thickness?: number;
    isUnresolved?: boolean;
    isActive?: boolean;
    isDimmed?: boolean;
  };
  const sourceNode = useInternalNode(String(source));
  const targetNode = useInternalNode(String(target));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourceWidth = sourceNode.measured?.width ?? sourceNode.width ?? 0;
  const sourceHeight = sourceNode.measured?.height ?? sourceNode.height ?? 0;
  const targetWidth = targetNode.measured?.width ?? targetNode.width ?? 0;
  const targetHeight = targetNode.measured?.height ?? targetNode.height ?? 0;

  const [edgePath] = getStraightPath({
    sourceX: sourceNode.internals.positionAbsolute.x + sourceWidth / 2,
    sourceY: sourceNode.internals.positionAbsolute.y + sourceHeight / 2,
    targetX: targetNode.internals.positionAbsolute.x + targetWidth / 2,
    targetY: targetNode.internals.positionAbsolute.y + targetHeight / 2,
  });

  return (
    <BaseEdge
      id={String(id)}
      path={edgePath}
      style={{
        stroke: edgeData.isActive
          ? "rgba(46, 125, 69, 0.45)"
          : "rgba(130, 130, 130, 0.28)",
        strokeWidth: (edgeData.thickness ?? 0.8) * (edgeData.isActive ? 1.7 : 1),
        strokeDasharray: edgeData.isUnresolved ? "4 4" : undefined,
        opacity: edgeData.isDimmed ? 0.12 : edgeData.isUnresolved ? 0.35 : 0.6,
        animation: "graphEdgeFadeIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s backwards",
      }}
    />
  );
});
