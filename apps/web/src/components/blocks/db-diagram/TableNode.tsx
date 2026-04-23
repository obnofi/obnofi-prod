import { memo, useState, useCallback, useRef } from 'react'
import { Handle, Position, useConnection } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { KeyRound, Link2, Circle } from 'lucide-react'
import type { TableNodeData, ColumnDef } from '@obnofi/types/db-diagram'

const TableNode = memo(function TableNode(props: NodeProps) {
  const { data, selected } = props
  const nodeData = data as TableNodeData
  const { table, onTableChange, onColumnSelect, showHandles } = nodeData
  const connection = useConnection()
  const isConnecting = !!connection.fromHandle
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(table.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleNameDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingName(true)
    setEditName(table.name)
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }, [table.name])

  const handleNameSubmit = useCallback(() => {
    if (editName.trim() && editName !== table.name) {
      onTableChange?.({
        ...table,
        name: editName.trim()
      })
    }
    setIsEditingName(false)
  }, [editName, table, onTableChange])

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      handleNameSubmit()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
      setEditName(table.name)
    }
  }, [handleNameSubmit, table.name])

  const handleColumnClick = useCallback((column: ColumnDef) => {
    onColumnSelect?.(column)
  }, [onColumnSelect])

  const handleAddColumn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const newColumn: ColumnDef = {
      name: `column_${table.columns.length + 1}`,
      type: 'VARCHAR(255)',
      nullable: true,
      primaryKey: false,
      unique: false,
      autoIncrement: false
    }
    onTableChange?.({
      ...table,
      columns: [...table.columns, newColumn]
    })
  }, [table, onTableChange])

  const handleDeleteColumn = useCallback((e: React.MouseEvent, columnName: string) => {
    e.stopPropagation()
    onTableChange?.({
      ...table,
      columns: table.columns.filter(c => c.name !== columnName),
      foreignKeys: table.foreignKeys.filter(fk => fk.columnName !== columnName)
    })
  }, [table, onTableChange])

  const getColumnIcon = (column: ColumnDef) => {
    if (column.primaryKey) {
      return <KeyRound className="w-3 h-3 text-amber-500" />
    }
    if (column.unique) {
      return <Link2 className="w-3 h-3 text-blue-500" />
    }
    return <Circle className="w-2 h-2 text-gray-400 fill-gray-400" />
  }

  return (
    <div
      className={`
        w-[240px] rounded-lg shadow-lg border-2
        ${selected ? 'border-[#2E7D45] shadow-xl' : 'border-transparent'}
        bg-white dark:bg-[#1a1a1a]
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Table Header */}
      <div
        className="h-9 px-3 flex items-center justify-between bg-[#2E7D45] text-white rounded-t-[5px]"
        onDoubleClick={handleNameDoubleClick}
      >
        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            className="w-full bg-transparent text-white text-sm font-medium outline-none border-b border-white/50"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm font-medium truncate">{table.name}</span>
        )}
        <button
          onClick={handleAddColumn}
          className="ml-2 w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          title="Add column"
        >
          +
        </button>
      </div>

      {/* Columns List */}
      <div className="py-1">
        {table.columns.map((column, index) => (
          <div
            key={`${column.name}-${index}`}
            className="relative h-7 px-3 flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
            onClick={() => handleColumnClick(column)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Column Icon */}
              <span className="w-4 flex items-center justify-center">
                {getColumnIcon(column)}
              </span>
              
              {/* Column Name */}
              <span className={`text-xs truncate ${column.primaryKey ? 'font-semibold' : ''}`}>
                {column.name}
              </span>
            </div>

            {/* Column Type */}
            <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
              {column.type}
            </span>

            {/* Delete button on hover */}
            <button
              onClick={(e) => handleDeleteColumn(e, column.name)}
              className="ml-2 w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
              title="Delete column"
            >
              ×
            </button>

            {/* FK badge — visible when dragging a connection toward this table */}
            {isConnecting && (
              <div
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20"
                style={{ left: -38 }}
              >
                <div className="w-7 h-7 rounded-full bg-[#2E7D45] border-2 border-white dark:border-[#1a1a1a] shadow-lg flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white leading-none">FK</span>
                </div>
              </div>
            )}

            {/* Source handle — right edge */}
            <Handle
              type="source"
              position={Position.Right}
              id={`src::${column.name}`}
              className={`!w-3 !h-3 !bg-[#2E7D45] !border-2 !border-white dark:!border-[#1a1a1a] transition-opacity ${showHandles ? 'opacity-100' : 'opacity-0'}`}
              style={{ right: -6 }}
            />

            {/* Target handle — left edge */}
            <Handle
              type="target"
              position={Position.Left}
              id={`tgt::${column.name}`}
              className={`!bg-[#2E7D45] !border-2 !border-white dark:!border-[#1a1a1a] transition-all ${
                isConnecting ? '!w-5 !h-5 opacity-100' : `!w-3 !h-3 ${showHandles ? 'opacity-100' : 'opacity-0'}`
              }`}
              style={{ left: isConnecting ? -10 : -6 }}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

export default TableNode
