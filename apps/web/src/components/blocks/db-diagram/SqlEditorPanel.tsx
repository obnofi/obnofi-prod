import { useCallback, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLang, MySQL } from '@codemirror/lang-sql'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { xcodeLight } from '@uiw/codemirror-theme-xcode'
import { useTheme } from 'next-themes'

interface SqlEditorPanelProps {
  sql: string
  onChange: (value: string) => void
  parseError: string | null
  tableCount: number
  width: number
  onResize: (delta: number) => void
}

export default function SqlEditorPanel({
  sql,
  onChange,
  parseError,
  tableCount,
  width,
  onResize
}: SqlEditorPanelProps) {
  const { resolvedTheme } = useTheme()
  const [isResizing, setIsResizing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [sql])

  const handleResizeStart = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!isResizing) return
    onResize(e.movementX)
  }, [isResizing, onResize])

  const isDark = resolvedTheme === 'dark'

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-[#111110] border-r border-gray-200 dark:border-gray-800 relative"
      style={{ width: `${width}px`, minWidth: '200px', maxWidth: '600px' }}
      onMouseMove={handleResizeMove}
      onMouseUp={handleResizeEnd}
      onMouseLeave={handleResizeEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
            SQL 에디터
          </span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            MySQL
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`
            px-2.5 py-1 text-xs font-medium rounded transition-colors
            ${copied 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          {copied ? '복사됨' : '복사'}
        </button>
      </div>

      {/* CodeMirror Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={sql}
          height="100%"
          extensions={[sqlLang({ dialect: MySQL })]}
          theme={isDark ? vscodeDark : xcodeLight}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
            closeBrackets: true,
            bracketMatching: true,
            indentOnInput: true
          }}
          className="h-full text-sm"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a]">
        {parseError ? (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs truncate max-w-[200px]">{parseError}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs">{tableCount}개 테이블</span>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className={`
          absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
          hover:bg-[#2E7D45] transition-colors
          ${isResizing ? 'bg-[#2E7D45]' : 'bg-transparent'}
        `}
        onMouseDown={handleResizeStart}
      />
    </div>
  )
}
