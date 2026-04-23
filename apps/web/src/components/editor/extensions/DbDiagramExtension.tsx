import { lazy, Suspense } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const LazyDbDiagramBlock = lazy(() => import('@/src/components/blocks/db-diagram/DbDiagramBlock'))

function DbDiagramBlockWrapper(props: NodeViewProps) {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-secondary)]">Loading diagram...</div>}>
      <LazyDbDiagramBlock {...(props as any)} />
    </Suspense>
  )
}

export interface DbDiagramOptions {
  HTMLAttributes: Record<string, unknown>
  workspaceId?: string
  pageId?: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dbDiagram: {
      insertDbDiagram: (options?: { sql?: string }) => ReturnType
    }
  }
}

export const DbDiagramExtension = Node.create<DbDiagramOptions>({
  name: 'dbDiagram',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      workspaceId: undefined,
      pageId: undefined,
    }
  },

  addAttributes() {
    return {
      sql: { default: '' },
      layout: { default: {} },
      workspaceId: { default: null },
      pageId: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="db-diagram"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(
      { 'data-type': 'db-diagram' },
      this.options.HTMLAttributes,
      HTMLAttributes
    )]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DbDiagramBlockWrapper)
  },

  addCommands() {
    return {
      insertDbDiagram: (options?: { sql?: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            sql: options?.sql || '',
            layout: {},
            workspaceId: this.options.workspaceId ?? null,
            pageId: this.options.pageId ?? null,
          }
        })
      }
    }
  }
})
