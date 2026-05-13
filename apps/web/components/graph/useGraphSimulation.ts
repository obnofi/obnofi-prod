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
  data: { size?: number };
}

interface SimulationEdge extends SimulationLinkDatum<SimulationNode> {
  source: string;
  target: string;
}

interface UseGraphSimulationParams {
  nodes: Array<Node<{ size?: number }, "graphNode">>;
  edges: Array<Edge<{ thickness?: number }, "graphEdge">>;
  graphKey: string;
  setNodes: React.Dispatch<React.SetStateAction<Array<Node<{ size?: number }, "graphNode">>>>;
}

export function useGraphSimulation({
  nodes,
  edges,
  graphKey,
  setNodes,
}: UseGraphSimulationParams) {
  const edgesRef = useRef(edges);
  const nodesRef = useRef(nodes);

  useEffect(() => { edgesRef.current = edges; });
  useEffect(() => { nodesRef.current = nodes; });

  useEffect(() => {
    const initialNodes = nodesRef.current;
    const initialEdges = edgesRef.current;

    if (initialNodes.length === 0) return;

    const isBig = initialNodes.length >= 500;
    // 150개 이하에서는 수렴 후에도 ambient noise로 계속 살짝 움직임
    const isAmbient = initialNodes.length <= 150;

    const simulationNodes: SimulationNode[] = initialNodes.map((node) => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      fx: node.dragging ? node.position.x : null,
      fy: node.dragging ? node.position.y : null,
      data: node.data,
    }));

    const simulationEdges: SimulationEdge[] = initialEdges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const simulation = forceSimulation(simulationNodes)
      .force(
        "charge",
        forceManyBody()
          .strength(isBig ? -120 : -300)
          .theta(isBig ? 0.9 : 0.8),
      )
      .force(
        "link",
        forceLink(simulationEdges)
          .id((n) => n.id)
          .distance(80)
          .strength(0.5),
      )
      .force(
        "collide",
        forceCollide<SimulationNode>().radius((n) => (n.data.size ?? 10) / 2 + 18),
      )
      .force("center", forceCenter(0, 0))
      .alpha(1)
      .alphaMin(0.001)
      .alphaDecay(isAmbient ? 0.008 : 0.04)
      .alphaTarget(isAmbient ? 0.025 : 0)
      .velocityDecay(isAmbient ? 0.45 : 0.3);

    // ambient 노이즈: 수렴 후에도 노드가 살짝 계속 흔들림
    if (isAmbient) {
      simulation.force("noise", () => {
        for (const node of simulationNodes) {
          node.vx = (node.vx ?? 0) + (Math.random() - 0.5) * 0.07;
          node.vy = (node.vy ?? 0) + (Math.random() - 0.5) * 0.07;
        }
      });
    }

    simulation.on("tick", () => {
      setNodes((current) =>
        current.map((node) => {
          const next = simulationNodes.find((sn) => sn.id === node.id);
          if (!next) return node;
          return {
            ...node,
            position: {
              x: next.x ?? node.position.x,
              y: next.y ?? node.position.y,
            },
          };
        }),
      );
    });

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey, setNodes]);
}
