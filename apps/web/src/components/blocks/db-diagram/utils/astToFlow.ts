import type { Node, Edge } from '@xyflow/react'
import type { DbSchema, TableDef, TableNodeData, RelationEdgeData, ForeignKeyDef } from '@obnofi/types/db-diagram'
import dagre from '@dagrejs/dagre'

const NODE_WIDTH = 240
const NODE_HEADER_HEIGHT = 36
const NODE_ROW_HEIGHT = 28
const NODE_PADDING = 16

export interface FlowElements {
  nodes: Node<TableNodeData>[]
  edges: Edge<RelationEdgeData>[]
}

export function schemaToFlowElements(
  schema: DbSchema,
  existingPositions?: Map<string, { x: number; y: number }>
): FlowElements {
  const nodes: Node<TableNodeData>[] = []
  const edges: Edge<RelationEdgeData>[] = []

  // Create nodes
  for (const table of schema.tables) {
    const height = calculateNodeHeight(table)
    
    nodes.push({
      id: table.name,
      type: 'tableNode',
      position: existingPositions?.get(table.name) || { x: 0, y: 0 },
      data: { table },
      width: NODE_WIDTH,
      height
    })
  }

  // Create edges from foreign keys
  for (const table of schema.tables) {
    for (const fk of table.foreignKeys) {
      const edgeId = `${table.name}.${fk.columnName}-${fk.referencedTable}.${fk.referencedColumn}`
      
      edges.push({
        id: edgeId,
        source: table.name,
        target: fk.referencedTable,
        sourceHandle: `src::${fk.columnName}`,
        targetHandle: `tgt::${fk.referencedColumn}`,
        type: 'relationEdge',
        data: {
          foreignKey: fk,
          sourceTable: table.name,
          targetTable: fk.referencedTable
        }
      })
    }
  }

  // Apply auto-layout if no existing positions
  if (!existingPositions || existingPositions.size === 0) {
    const layouted = applyDagreLayout(nodes, edges)
    return layouted
  }

  return { nodes, edges }
}

export function applyDagreLayout(
  nodes: Node<TableNodeData>[],
  edges: Edge<RelationEdgeData>[]
): FlowElements {
  const g = new dagre.graphlib.Graph()
  
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 100,
    marginx: 20,
    marginy: 20
  })
  
  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes
  for (const node of nodes) {
    g.setNode(node.id, {
      width: node.width || NODE_WIDTH,
      height: node.height || calculateNodeHeight(node.data.table)
    })
  }

  // Add edges
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  // Run layout
  dagre.layout(g)

  // Update node positions
  const layoutedNodes = nodes.map(node => {
    const graphNode = g.node(node.id)
    return {
      ...node,
      position: {
        x: graphNode.x - (graphNode.width / 2),
        y: graphNode.y - (graphNode.height / 2)
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function calculateNodeHeight(table: TableDef): number {
  const columnCount = table.columns.length
  return NODE_HEADER_HEIGHT + (columnCount * NODE_ROW_HEIGHT) + NODE_PADDING
}

export function extractPositions(nodes: Node[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  
  for (const node of nodes) {
    positions.set(node.id, { ...node.position })
  }
  
  return positions
}

export function flowElementsToSchema(
  nodes: Node<TableNodeData>[],
  edges: Edge<RelationEdgeData>[]
): DbSchema {
  const tables: TableDef[] = []
  const fkMap = new Map<string, ForeignKeyDef[]>()

  // Group edges by source table to rebuild foreign keys
  for (const edge of edges) {
    if (!edge.data) continue
    
    const { foreignKey } = edge.data
    const sourceTable = edge.source
    
    if (!fkMap.has(sourceTable)) {
      fkMap.set(sourceTable, [])
    }
    
    fkMap.get(sourceTable)!.push(foreignKey)
  }

  // Build tables from nodes
  for (const node of nodes) {
    if (!node.data?.table) continue
    
    const table = {
      ...node.data.table,
      foreignKeys: fkMap.get(node.id) || []
    }
    
    tables.push(table)
  }

  return { tables }
}
