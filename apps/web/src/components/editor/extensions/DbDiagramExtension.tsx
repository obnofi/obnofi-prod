"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { type MouseEvent } from 'react'
import { InputRule, Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import dynamic from 'next/dynamic'
import { blockActionsPluginKey } from '@/components/editor/extensions/blockActionsPluginKey'
import {
  preventInlineBlockDrag,
  shouldStopInlineBlockEvent,
} from '@/lib/editor/inlineBlockInteractions'

const DbDiagramBlock = dynamic(
  () => import('@/src/components/blocks/db-diagram/DbDiagramBlock'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-secondary)]">
        Loading diagram...
      </div>
    ),
  }
)

function DbDiagramBlockWrapper(props: NodeViewProps) {
  const markDbDiagramHovered = (event: MouseEvent<HTMLElement>) => {
    const blockElement = event.currentTarget.closest<HTMLElement>("[data-grove-block='true']")
    const blockId = blockElement?.dataset.blockId ?? String(props.node.attrs.blockId ?? '')

    if (!blockId || !props.editor.isEditable) {
      return
    }

    const pluginState = blockActionsPluginKey.getState(props.editor.state)
    if (pluginState?.hoveredBlockId === blockId) {
      return
    }

    props.editor.view.dispatch(
      props.editor.state.tr.setMeta(blockActionsPluginKey, { hoveredBlockId: blockId })
    )
  }

  return (
    <NodeViewWrapper
      className="db-diagram-block my-2"
      contentEditable={false}
      data-testid="db-diagram-block"
      data-inline-block="true"
      onDragStart={preventInlineBlockDrag}
      onMouseMoveCapture={markDbDiagramHovered}
    >
      <DbDiagramBlock {...(props as any)} />
    </NodeViewWrapper>
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

  selectable: false,

  draggable: false,

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
    return ReactNodeViewRenderer(DbDiagramBlockWrapper, {
      stopEvent: ({ event }) => shouldStopInlineBlockEvent(event),
    })
  },

  addCommands() {
    return {
      insertDbDiagram: (options?: { sql?: string }) => ({ commands }) => {
        return commands.insertContent([
          {
            type: this.name,
            attrs: {
              sql: options?.sql || '',
              layout: {},
              workspaceId: this.options.workspaceId ?? null,
              pageId: this.options.pageId ?? null,
            }
          },
          { type: 'paragraph' },
        ])
      }
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/(?:dbdiagram|db-diagram|diagramdb|erd|db)$/,
        handler: ({ state, range, chain }) => {
          const from = range.from
          const to = range.to
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, '\n', '\0')
          const deleteFrom = prefix === ' ' ? from - 1 : from

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent([
              {
                type: this.name,
                attrs: {
                  sql: '',
                  layout: {},
                  workspaceId: this.options.workspaceId ?? null,
                  pageId: this.options.pageId ?? null,
                }
              },
              { type: 'paragraph' },
            ])
            .run()
        },
      }),
    ]
  }
})
