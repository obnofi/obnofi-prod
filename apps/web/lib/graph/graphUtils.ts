import type { ID, Page, GraphData, GraphNode, GraphEdge } from '@obnofi/types/core';
import type { LinkIndex } from './backlinks';

function getPageTitle(page: Page): string {
  for (const [, propValue] of Object.entries(page.propertyValues)) {
    if (propValue.type === 'title' && propValue.value) {
      return String(propValue.value);
    }
  }

  for (const block of page.content) {
    if (block.content?.richText) {
      const text = block.content.richText.map(rt => rt.text?.content || '').join('');
      if (text.trim()) return text.trim();
    }
  }

  return 'Untitled';
}

export function buildGraphData(
  index: LinkIndex,
  pages: Map<ID, Page>,
  options?: { centerNodeId?: ID; depth?: number; includeDatabases?: boolean }
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new Set<ID>();
  const nodeMap = new Map<ID, GraphNode>();

  const addNode = (pageId: ID, depth = 0) => {
    if (visited.has(pageId)) return;
    visited.add(pageId);

    const page = pages.get(pageId);
    if (!page) return;

    const node: GraphNode = {
      id: pageId,
      type: page.databaseId ? 'database' : 'page',
      title: getPageTitle(page),
      icon: page.icon,
      depth,
    };

    nodes.push(node);
    nodeMap.set(pageId, node);

    const outgoing = index.outgoing.get(pageId);
    if (outgoing) {
      for (const targetId of outgoing) {
        edges.push({ source: pageId, target: targetId, type: 'link' });

        if (options?.depth === undefined || depth < options.depth) {
          addNode(targetId, depth + 1);
        }
      }
    }

    const incoming = index.incoming.get(pageId);
    if (incoming) {
      for (const sourceId of incoming) {
        const exists = edges.some(e => e.source === sourceId && e.target === pageId);

        if (!exists) {
          edges.push({ source: sourceId, target: pageId, type: 'link' });
        }

        if (options?.depth === undefined || depth < options.depth) {
          addNode(sourceId, depth + 1);
        }
      }
    }
  };

  if (options?.centerNodeId) {
    addNode(options.centerNodeId, 0);
  } else {
    for (const pageId of pages.keys()) {
      addNode(pageId);
    }
  }

  return { nodes, edges };
}

export function findShortestPath(index: LinkIndex, fromId: ID, toId: ID): ID[] | null {
  if (fromId === toId) return [fromId];

  const queue: Array<{ id: ID; path: ID[] }> = [{ id: fromId, path: [fromId] }];
  const visited = new Set<ID>();

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    const outgoing = index.outgoing.get(id);
    if (outgoing) {
      for (const nextId of outgoing) {
        if (nextId === toId) return [...path, nextId];
        if (!visited.has(nextId)) queue.push({ id: nextId, path: [...path, nextId] });
      }
    }

    const incoming = index.incoming.get(id);
    if (incoming) {
      for (const prevId of incoming) {
        if (prevId === toId) return [...path, prevId];
        if (!visited.has(prevId)) queue.push({ id: prevId, path: [...path, prevId] });
      }
    }
  }

  return null;
}
