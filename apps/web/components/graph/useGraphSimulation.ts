"use client";

import { useEffect, useRef } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { Edge, Node } from "@xyflow/react";

interface SimulationNode extends SimulationNodeDatum {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  data: { size?: number; label?: unknown };
}

interface SimulationEdge extends SimulationLinkDatum<SimulationNode> {
  source: string;
  target: string;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function isFinitePosition(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

function getVisualRadius(node: { data: { size?: number; label?: unknown } }) {
  const size = node.data.size ?? 10;
  return Math.max(14, size / 2);
}

function getCollisionRadius(node: { data: { size?: number; label?: unknown } }) {
  return getVisualRadius(node) + 20;
}

function createSeedPosition(index: number, total: number) {
  const safeTotal = Math.max(1, total);
  const baseSpacing = Math.max(92, Math.min(168, 72 + Math.sqrt(safeTotal) * 5));
  const radius = Math.sqrt(index + 0.5) * baseSpacing;
  const angle = index * GOLDEN_ANGLE;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function hasSpreadPositions(
  nodes: Array<Node<{ size?: number }, "graphNode">>
) {
  const positions = nodes.filter(
    (node) => isFinitePosition(node.position.x) && isFinitePosition(node.position.y)
  );

  if (positions.length === 0) {
    return false;
  }

  const avgRadius =
    positions.reduce(
      (sum, node) => sum + Math.hypot(node.position.x, node.position.y),
      0
    ) / positions.length;

  return avgRadius > 48;
}

interface UseGraphSimulationParams {
  nodes: Array<Node<{ size?: number }, "graphNode">>;
  edges: Array<Edge<{ thickness?: number }, "graphEdge">>;
  graphKey: string;
  setNodes: React.Dispatch<
    React.SetStateAction<Array<Node<{ size?: number }, "graphNode">>>
  >;
}

export function useGraphSimulation({
  nodes,
  edges,
  graphKey,
  setNodes,
}: UseGraphSimulationParams) {
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimulationNode>> | null>(null);
  const nodeMapRef = useRef<Map<string, SimulationNode>>(new Map());
  const isRunningRef = useRef(false);
  const currentNodesRef = useRef(nodes);
  const currentEdgesRef = useRef(edges);
  const draggingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    currentNodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    currentEdgesRef.current = edges;
  }, [edges]);

  const hasNodes = nodes.length > 0;

  useEffect(() => {
    const currentNodes = currentNodesRef.current;
    const currentEdges = currentEdgesRef.current;

    if (currentNodes.length === 0) {
      return;
    }

    const isBig = currentNodes.length >= 500;
    const preserveCurrentPositions = hasSpreadPositions(currentNodes);

    const simNodes: SimulationNode[] = currentNodes.map((node, index) => {
      const seeded = createSeedPosition(index, currentNodes.length);
      const x =
        preserveCurrentPositions && isFinitePosition(node.position.x)
          ? node.position.x
          : seeded.x;
      const y =
        preserveCurrentPositions && isFinitePosition(node.position.y)
          ? node.position.y
          : seeded.y;

      return {
        id: node.id,
        x,
        y,
        vx: 0,
        vy: 0,
        data: node.data,
      };
    });

    nodeMapRef.current = new Map(simNodes.map((node) => [node.id, node]));

    const simEdges: SimulationEdge[] = currentEdges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const simulation = forceSimulation(simNodes)
      .force(
        "charge",
        forceManyBody()
          .strength(isBig ? -280 : -460)
          .distanceMin(24)
          .distanceMax(isBig ? 520 : 680)
      )
      .force(
        "link",
        forceLink(simEdges)
          .id((node) => node.id)
          .distance(() => (isBig ? 74 : 88))
          .strength(isBig ? 0.18 : 0.24)
      )
      .force(
        "collide",
        forceCollide<SimulationNode>()
          .radius((node) => getCollisionRadius(node))
          .strength(0.85)
          .iterations(isBig ? 2 : 4)
      )
      .force("center", forceCenter(0, 0))
      .alpha(0.72)
      .alphaDecay(isBig ? 0.07 : 0.05)
      .velocityDecay(0.55);

    simulationRef.current = simulation;
    isRunningRef.current = true;

    simulation.tick(isBig ? 130 : 250);

    setNodes((current) =>
      current.map((node) => {
        const simNode = nodeMapRef.current.get(node.id);

        if (!simNode) {
          return node;
        }

        return {
          ...node,
          position: { x: simNode.x, y: simNode.y },
        };
      })
    );

    simulation.on("tick", () => {
      if (!isRunningRef.current) {
        return;
      }

      setNodes((current) =>
        current.map((node) => {
          const simNode = nodeMapRef.current.get(node.id);

          if (!simNode) {
            return node;
          }

          return {
            ...node,
            position: { x: simNode.x, y: simNode.y },
          };
        })
      );
    });

    return () => {
      isRunningRef.current = false;
      simulation.stop();
      simulationRef.current = null;
    };
  }, [graphKey, setNodes, hasNodes]);

  useEffect(() => {
    const simulation = simulationRef.current;

    if (!simulation) {
      return;
    }

    const prevDragging = draggingIdsRef.current;
    const nowDragging = new Set<string>();

    for (const node of nodes) {
      const simNode = nodeMapRef.current.get(node.id);

      if (!simNode) {
        continue;
      }

      if (node.dragging) {
        nowDragging.add(node.id);
        simNode.fx = node.position.x;
        simNode.fy = node.position.y;
      } else if (simNode.fx !== null || simNode.fy !== null) {
        simNode.fx = null;
        simNode.fy = null;
      }
    }

    const startedDragging = [...nowDragging].some((id) => !prevDragging.has(id));
    const stoppedDragging = [...prevDragging].some((id) => !nowDragging.has(id));

    draggingIdsRef.current = nowDragging;

    if (startedDragging) {
      simulation.alphaTarget(0.1).restart();
    } else if (stoppedDragging) {
      simulation.alphaTarget(0).alpha(0.04);
    }
  }, [nodes]);
}
