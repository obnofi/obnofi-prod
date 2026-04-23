import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import TableNode from './TableNode'
import RelationEdge from './RelationEdge'
import type { TableNodeData, TableDef, DbSchema } from '@obnofi/types/db-diagram'

interface ErdCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: any[]) => void
  onEdgesChange: (changes: any[]) => void
  onConnect: (connection: Connection) => void
  onSchemaChange: (schema: DbSchema) => void
}

export interface ErdCanvasHandle {
  addTable: () => void
  fitView: () => void
}

const nodeTypes = {
  tableNode: TableNode as any
}

const edgeTypes = {
  relationEdge: RelationEdge as any
}

const ErdCanvas = forwardRef<ErdCanvasHandle, ErdCanvasProps>(function ErdCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSchemaChange
}, ref) {
  const { fitView } = useReactFlow()
  const [selectedColumn, setSelectedColumn] = useState<{ table: TableDef; column: any } | null>(null)
  const [showHandles, setShowHandles] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const handleTableChange = useCallback((updatedTable: TableDef) => {
    const updatedNodes = nodes.map(node => {
      const nodeData = node.data as TableNodeData
      if (node.id === updatedTable.name || nodeData.table?.name === updatedTable.name) {
        return { ...node, id: updatedTable.name, data: { ...nodeData, table: updatedTable } }
      }
      return node
    })
    onSchemaChange({ tables: updatedNodes.map(n => (n.data as TableNodeData).table) })
  }, [nodes, onSchemaChange])

  const handleColumnSelect = useCallback((table: TableDef, column: any) => {
    setSelectedColumn({ table, column })
  }, [])

  const handleAddTable = useCallback(() => {
    const newTable: TableDef = {
      name: `new_table_${Date.now()}`,
      columns: [
        { name: 'id', type: 'BIGINT', nullable: false, primaryKey: true, unique: true, autoIncrement: true }
      ],
      foreignKeys: []
    }
    const updatedNodes: Node[] = [
      ...nodes,
      {
        id: newTable.name,
        type: 'tableNode',
        position: { x: 100, y: 100 },
        data: { table: newTable, onTableChange: handleTableChange, onColumnSelect: (col: any) => handleColumnSelect(newTable, col) }
      } as Node
    ]
    onSchemaChange({ tables: updatedNodes.map(n => (n.data as TableNodeData).table) })
  }, [nodes, handleTableChange, handleColumnSelect, onSchemaChange])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 })
  }, [fitView])

  useImperativeHandle(ref, () => ({
    addTable: handleAddTable,
    fitView: handleFitView,
  }), [handleAddTable, handleFitView])

  const enhancedNodes = nodes.map(node => {
    const nodeData = node.data as TableNodeData
    return {
      ...node,
      data: {
        ...nodeData,
        showHandles,
        onTableChange: handleTableChange,
        onColumnSelect: (col: any) => handleColumnSelect(nodeData.table, col)
      }
    }
  })

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative"
      onMouseEnter={() => setShowHandles(true)}
      onMouseLeave={() => setShowHandles(false)}
    >
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
        deleteKeyCode="Delete"
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Control"
        nodesDraggable
        nodesConnectable
        elementsSelectable
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.1}
        maxZoom={2}
        connectionRadius={50}
        defaultEdgeOptions={{
          type: 'relationEdge',
          animated: false,
          style: { strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#9ca3af' }
        }}
        connectionLineStyle={{ stroke: '#2E7D45', strokeWidth: 2, strokeDasharray: '5,5' }}
      >
        <Background color="#e5e7eb" gap={20} size={1} className="!bg-transparent dark:!bg-transparent" />
        <Controls className="!bg-white dark:!bg-[#1a1a1a] !border-gray-200 dark:!border-gray-700" showInteractive={false} />
        <MiniMap
          className="!bg-white dark:!bg-[#1a1a1a] !border-gray-200 dark:!border-gray-700"
          nodeColor={node => node.selected ? '#2E7D45' : '#9ca3af'}
          maskColor="rgba(0, 0, 0, 0.1)"
        />

      </ReactFlow>

      {/* Column Edit Panel */}
      {selectedColumn && (
        <div className="absolute right-4 top-4 w-52 bg-white dark:bg-[#202020] rounded-md shadow-lg border border-[#E3E2E0] dark:border-[#373737] p-3 z-10">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold text-[#37352F] dark:text-[#FFFCED]">컬럼 편집</h5>
            <button onClick={() => setSelectedColumn(null)} className="text-[#787774] hover:text-[#37352F] dark:hover:text-[#FFFCED] text-sm">×</button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-[#787774] dark:text-[#7F7F7F] mb-1">컬럼명</label>
              <input
                type="text"
                value={selectedColumn.column.name}
                onChange={(e) => {
                  const updatedColumn = { ...selectedColumn.column, name: e.target.value }
                  const updatedTable = { ...selectedColumn.table, columns: selectedColumn.table.columns.map(c => c.name === selectedColumn.column.name ? updatedColumn : c) }
                  handleTableChange(updatedTable)
                  setSelectedColumn({ table: updatedTable, column: updatedColumn })
                }}
                className="w-full px-2 py-1 text-xs border border-[#E3E2E0] dark:border-[#373737] rounded bg-white dark:bg-[#191919] text-[#37352F] dark:text-[#FFFCED] focus:outline-none focus:ring-1 "
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#787774] dark:text-[#7F7F7F] mb-1">타입</label>
              <input
                type="text"
                value={selectedColumn.column.type}
                onChange={(e) => {
                  const updatedColumn = { ...selectedColumn.column, type: e.target.value }
                  const updatedTable = { ...selectedColumn.table, columns: selectedColumn.table.columns.map(c => c.name === selectedColumn.column.name ? updatedColumn : c) }
                  handleTableChange(updatedTable)
                  setSelectedColumn({ table: updatedTable, column: updatedColumn })
                }}
                className="w-full px-2 py-1 text-xs border border-[#E3E2E0] dark:border-[#373737] rounded bg-white dark:bg-[#191919] text-[#37352F] dark:text-[#FFFCED] focus:outline-none focus:ring-1 "
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {([
                { key: 'nullable', label: 'NULL' },
                { key: 'primaryKey', label: 'PK' },
                { key: 'unique', label: 'UQ' },
                { key: 'autoIncrement', label: 'AI' }
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1 px-1.5 py-0.5 bg-[#F7F7F5] dark:bg-[#2F2F2F] rounded cursor-pointer hover:bg-[#EBEBEA] dark:hover:bg-[#383838]">
                  <input
                    type="checkbox"
                    checked={(selectedColumn.column as any)[key]}
                    onChange={(e) => {
                      const updatedColumn = { ...selectedColumn.column, [key]: e.target.checked }
                      const updatedTable = { ...selectedColumn.table, columns: selectedColumn.table.columns.map(c => c.name === selectedColumn.column.name ? updatedColumn : c) }
                      handleTableChange(updatedTable)
                      setSelectedColumn({ table: updatedTable, column: updatedColumn })
                    }}
                    className="w-3 h-3 accent-[#2E7D45]"
                  />
                  <span className="text-[10px] text-[#787774] dark:text-[#7F7F7F]">{label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#787774] dark:text-[#7F7F7F] mb-1">기본값</label>
              <input
                type="text"
                value={selectedColumn.column.defaultValue || ''}
                onChange={(e) => {
                  const updatedColumn = { ...selectedColumn.column, defaultValue: e.target.value || undefined }
                  const updatedTable = { ...selectedColumn.table, columns: selectedColumn.table.columns.map(c => c.name === selectedColumn.column.name ? updatedColumn : c) }
                  handleTableChange(updatedTable)
                  setSelectedColumn({ table: updatedTable, column: updatedColumn })
                }}
                placeholder="NULL"
                className="w-full px-2 py-1 text-xs border border-[#E3E2E0] dark:border-[#373737] rounded bg-white dark:bg-[#191919] text-[#37352F] dark:text-[#FFFCED] focus:outline-none focus:ring-1 "
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default ErdCanvas
