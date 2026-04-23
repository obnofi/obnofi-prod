import { useState, useCallback, useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import type { Connection } from '@xyflow/react'
import type { DbSchema, ForeignKeyDef } from '@obnofi/types/db-diagram'
import { useDbDiagramSync } from '@/src/hooks/useDbDiagramSync'
import SqlEditorPanel from './SqlEditorPanel'
import ErdCanvas, { type ErdCanvasHandle } from './ErdCanvas'

interface DbDiagramLayoutProps {
  initialSql?: string
  onSqlChange?: (sql: string) => void
  onLayoutChange?: (layout: Record<string, { x: number; y: number }>) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  pageName?: string | null
}

const DEFAULT_SQL = `CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  role_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (email),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) COMMENT='유저 테이블';

CREATE TABLE IF NOT EXISTS roles (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  PRIMARY KEY (id)
) COMMENT='역할 테이블';`

export default function DbDiagramLayout({
  initialSql = DEFAULT_SQL,
  onSqlChange,
  onLayoutChange,
  isFullscreen = false,
  onToggleFullscreen,
  pageName,
}: DbDiagramLayoutProps) {
  const [panelWidth, setPanelWidth] = useState(320)
  const erdCanvasRef = useRef<ErdCanvasHandle>(null)
  
  const {
    sql,
    setSql,
    schema,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    updateSchemaFromErd,
    parseError,
    tableCount
  } = useDbDiagramSync(initialSql)

  const handleSqlChange = useCallback((newSql: string) => {
    setSql(newSql)
    onSqlChange?.(newSql)
  }, [setSql, onSqlChange])

  const handleResize = useCallback((delta: number) => {
    setPanelWidth(prev => {
      const newWidth = prev + delta
      return Math.max(200, Math.min(600, newWidth))
    })
  }, [])

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return

    // Handle IDs: "src::columnName" / "tgt::columnName"
    const sourceColumn = connection.sourceHandle?.replace(/^src::/, '') ?? ''

    // targetHandle may be null when dropped on node body — fall back to first PK column
    let targetColumn = connection.targetHandle?.replace(/^tgt::/, '') ?? ''
    if (!targetColumn) {
      const tgt = schema.tables.find(t => t.name === connection.target)
      targetColumn =
        tgt?.columns.find(c => c.primaryKey)?.name ??
        tgt?.columns.find(c => c.unique)?.name ??
        tgt?.columns[0]?.name ??
        ''
    }

    if (!sourceColumn || !targetColumn) return

    const sourceTable = schema.tables.find(t => t.name === connection.source)
    if (!sourceTable) return

    const duplicate = sourceTable.foreignKeys.find(
      fk => fk.columnName === sourceColumn &&
            fk.referencedTable === connection.target &&
            fk.referencedColumn === targetColumn
    )
    if (duplicate) return

    const updatedTables = schema.tables.map(table =>
      table.name === connection.source
        ? {
            ...table,
            foreignKeys: [
              ...table.foreignKeys,
              {
                columnName: sourceColumn,
                referencedTable: connection.target!,
                referencedColumn: targetColumn,
                onDelete: 'NO ACTION' as const,
                onUpdate: 'NO ACTION' as const
              }
            ]
          }
        : table
    )

    updateSchemaFromErd({ tables: updatedTables })
  }, [schema.tables, updateSchemaFromErd])

  const handleSchemaChange = useCallback((newSchema: DbSchema) => {
    updateSchemaFromErd(newSchema)
  }, [updateSchemaFromErd])

  return (
    <div
      className={
        isFullscreen
          ? 'db-diagram-fullscreen flex flex-col bg-white dark:bg-[#111110] fixed z-[40]'
          : 'flex flex-col h-full w-full bg-white dark:bg-[#111110] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800'
      }
      style={isFullscreen ? { left: '240px', top: 0, right: 0, bottom: 0 } : undefined}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] shrink-0">
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          {pageName && (
            <>
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{pageName}</span>
              <svg className="w-3 h-3 shrink-0 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
          <svg className="w-3.5 h-3.5 shrink-0 text-[#2E7D45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <span className="text-xs font-medium text-gray-800 dark:text-gray-100 shrink-0">DB 다이어그램</span>
        </div>

        {/* Right: action buttons + fullscreen toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => erdCanvasRef.current?.addTable()}
            className="px-2.5 py-1 bg-[#2E7D45] text-white text-xs font-medium rounded hover:bg-[#236338] transition-colors flex items-center gap-1"
            title="테이블 추가"
          >
            <span>+</span>
            테이블 추가
          </button>
          <button
            onClick={() => erdCanvasRef.current?.fitView()}
            className="px-2.5 py-1 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="화면 맞춤"
          >
            맞춤 보기
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isFullscreen ? '인라인으로 보기' : '전체 화면으로 보기'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <ReactFlowProvider>
          <SqlEditorPanel
            sql={sql}
            onChange={handleSqlChange}
            parseError={parseError}
            tableCount={tableCount}
            width={panelWidth}
            onResize={handleResize}
          />
          <ErdCanvas
            ref={erdCanvasRef}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onSchemaChange={handleSchemaChange}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
