import { memo, useState, useCallback } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import type { RelationEdgeData, ForeignKeyDef } from '@obnofi/types/db-diagram'

const RelationEdge = memo(function RelationEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd, markerStart } = props
  const edgeData = data as RelationEdgeData | undefined
  const foreignKey = edgeData?.foreignKey
  const onFkChange = edgeData?.onFkChange
  const [isEditing, setIsEditing] = useState(false)
  const [editFk, setEditFk] = useState<ForeignKeyDef | null>(null)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3
  })

  if (!foreignKey) {
    return (
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: selected ? '#2E7D45' : '#9ca3af',
          strokeWidth: selected ? 3 : 2
        }}
      />
    )
  }

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditFk(foreignKey)
  }, [foreignKey])

  const handleSave = useCallback(() => {
    if (editFk) {
      onFkChange?.(editFk)
    }
    setIsEditing(false)
  }, [editFk, onFkChange])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditFk(foreignKey)
  }, [foreignKey])

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: selected ? '#2E7D45' : '#9ca3af',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: foreignKey.onDelete === 'SET NULL' ? '5,5' : undefined
        }}
      />

      <EdgeLabelRenderer>
        <div
          className={`
            absolute px-2 py-1 rounded text-xs font-medium
            transform -translate-x-1/2 -translate-y-1/2
            transition-all duration-200 cursor-pointer
            ${selected
              ? 'bg-[#2E7D45] text-white shadow-lg'
              : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }
          `}
          style={{
            left: labelX,
            top: labelY,
            pointerEvents: 'all'
          }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing && editFk ? (
            <div
              className="flex flex-col gap-2 min-w-[180px] p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">ON DELETE</span>
                <select
                  value={editFk.onDelete || 'NO ACTION'}
                  onChange={(e) => setEditFk({ ...editFk, onDelete: e.target.value as any })}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  <option value="NO ACTION">NO ACTION</option>
                  <option value="CASCADE">CASCADE</option>
                  <option value="SET NULL">SET NULL</option>
                  <option value="RESTRICT">RESTRICT</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">ON UPDATE</span>
                <select
                  value={editFk.onUpdate || 'NO ACTION'}
                  onChange={(e) => setEditFk({ ...editFk, onUpdate: e.target.value as any })}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  <option value="NO ACTION">NO ACTION</option>
                  <option value="CASCADE">CASCADE</option>
                  <option value="SET NULL">SET NULL</option>
                  <option value="RESTRICT">RESTRICT</option>
                </select>
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSave}
                  className="flex-1 px-2 py-1 text-xs bg-[#2E7D45] text-white rounded hover:bg-[#236338]"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="truncate max-w-[120px]">{foreignKey.columnName}</span>
              <span className="text-gray-400">→</span>
              <span className="truncate max-w-[120px]">{foreignKey.referencedColumn}</span>
              {foreignKey.onDelete && foreignKey.onDelete !== 'NO ACTION' && (
                <span className="ml-1 text-[10px] opacity-70">({foreignKey.onDelete})</span>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

export default RelationEdge
