import { useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { ReactFlowProvider } from '@xyflow/react'
import dynamic from 'next/dynamic'
import { usePageStore } from '@/store/pageStore'

const DbDiagramLayout = dynamic(() => import('./DbDiagramLayout'), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Loading database diagram...</div> })

interface DbDiagramBlockProps {
  node: {
    attrs: {
      sql?: string
      layout?: Record<string, { x: number; y: number }>
      pageId?: string | null
      workspaceId?: string | null
    }
  }
  updateAttributes: (attrs: Record<string, any>) => void
}

export default function DbDiagramBlock({ node, updateAttributes }: DbDiagramBlockProps) {
  const { sql = '', layout = {}, pageId = null } = node.attrs
  const { pages } = usePageStore()
  const parentPage = pageId ? pages.find(p => p.id === pageId) : null
  const pageName = parentPage?.title || null
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  const handleSqlChange = (newSql: string) => {
    updateAttributes({ sql: newSql })
  }

  const handleLayoutChange = (newLayout: Record<string, { x: number; y: number }>) => {
    updateAttributes({ layout: newLayout })
  }

  return (
    <NodeViewWrapper className="db-diagram-block">
      <div className="my-4 h-[500px]">
        <ReactFlowProvider>
          <DbDiagramLayout
            initialSql={sql}
            onSqlChange={handleSqlChange}
            onLayoutChange={handleLayoutChange}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(f => !f)}
            pageName={pageName}
          />
        </ReactFlowProvider>
      </div>
      {isFullscreen && (
        <div
          className="fixed left-60 right-0 top-0 bottom-0 bg-black/40 z-[35] backdrop-blur-[2px]"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </NodeViewWrapper>
  )
}
