"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";

type ColumnLayoutAttrs = {
  columns: 2 | 3;
};

type DraggedColumnBlock = {
  pos: number;
};

const columnBlockDragKey = new PluginKey("groveColumnBlockDrag");

function isDirectColumnBlock(
  node: ProseMirrorNode,
  parent: ProseMirrorNode | null
) {
  return node.isBlock && parent?.type.name === "groveColumn";
}

function getColumnDepth(doc: ProseMirrorNode, pos: number) {
  const $pos = doc.resolve(pos);

  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === "groveColumn") {
      return depth;
    }
  }

  return null;
}

function getDirectChildDropPos(
  view: EditorView,
  event: DragEvent
) {
  const coords = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });

  if (!coords) {
    return null;
  }

  const { doc } = view.state;
  const $pos = doc.resolve(coords.pos);
  let columnDepth: number | null = null;

  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === "groveColumn") {
      columnDepth = depth;
      break;
    }
  }

  if (columnDepth === null) {
    return null;
  }

  const columnStart = $pos.start(columnDepth);
  const columnEnd = $pos.end(columnDepth);

  if ($pos.depth <= columnDepth) {
    return Math.min(Math.max(coords.pos, columnStart), columnEnd);
  }

  const directChildDepth = columnDepth + 1;
  const targetBlockPos = $pos.before(directChildDepth);
  const targetNode = doc.nodeAt(targetBlockPos);

  if (!targetNode || !targetNode.isBlock) {
    return columnEnd;
  }

  const targetDom = view.nodeDOM(targetBlockPos);
  const targetElement =
    targetDom instanceof HTMLElement ? targetDom : targetDom?.parentElement;
  const targetRect = targetElement?.getBoundingClientRect();
  const isAfter = targetRect
    ? event.clientY > targetRect.top + targetRect.height / 2
    : coords.pos > targetBlockPos + targetNode.nodeSize / 2;

  const dropPos = isAfter
    ? targetBlockPos + targetNode.nodeSize
    : targetBlockPos;

  return Math.min(
    Math.max(dropPos, columnStart),
    columnEnd
  );
}

function moveColumnBlock(
  view: EditorView,
  dragged: DraggedColumnBlock,
  event: DragEvent
) {
  const { state } = view;
  const node = state.doc.nodeAt(dragged.pos);

  if (!node || !isDirectColumnBlock(node, state.doc.resolve(dragged.pos).parent)) {
    return false;
  }

  let dropPos = getDirectChildDropPos(view, event);

  if (dropPos === null) {
    return false;
  }

  const sourceStart = dragged.pos;
  const sourceEnd = dragged.pos + node.nodeSize;

  if (dropPos >= sourceStart && dropPos <= sourceEnd) {
    return true;
  }

  if (sourceStart < dropPos) {
    dropPos -= node.nodeSize;
  }

  const targetColumnDepth = getColumnDepth(state.doc, dropPos);
  if (targetColumnDepth === null) {
    return false;
  }

  const tr = state.tr
    .delete(sourceStart, sourceEnd)
    .insert(dropPos, node)
    .scrollIntoView();

  view.dispatch(tr);
  view.focus();
  return true;
}

function createColumnBlockDragPlugin() {
  let draggedBlock: DraggedColumnBlock | null = null;

  return new Plugin({
    key: columnBlockDragKey,
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];

        state.doc.descendants((node, pos, parent) => {
          if (!isDirectColumnBlock(node, parent)) {
            return;
          }

          decorations.push(
            Decoration.widget(
              pos,
              () => {
                const handle = document.createElement("button");
                handle.type = "button";
                handle.className = "grove-block-drag-handle";
                handle.draggable = true;
                handle.contentEditable = "false";
                handle.dataset.groveBlockPos = String(pos);
                handle.setAttribute("aria-label", "블록 이동");
                handle.title = "블록 이동";
                handle.textContent = "⋮⋮";
                return handle;
              },
              {
                key: `grove-block-drag-handle-${pos}`,
                side: -1,
              }
            ),
            Decoration.node(pos, pos + node.nodeSize, {
              class: "grove-draggable-block",
            })
          );
        });

        return DecorationSet.create(state.doc, decorations);
      },
      handleDOMEvents: {
        dragstart(view, event) {
          const target = event.target;
          const handle =
            target instanceof HTMLElement
              ? target.closest<HTMLElement>("[data-grove-block-pos]")
              : null;

          if (!handle) {
            return false;
          }

          const pos = Number(handle.dataset.groveBlockPos);
          const node = Number.isFinite(pos) ? view.state.doc.nodeAt(pos) : null;

          if (!node) {
            return false;
          }

          draggedBlock = { pos };
          view.dispatch(
            view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos))
          );

          event.dataTransfer?.setData("text/plain", "");
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
          }

          return true;
        },
        dragover(_view, event) {
          if (!draggedBlock) {
            return false;
          }

          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }
          return true;
        },
        drop(view, event) {
          if (!draggedBlock) {
            return false;
          }

          event.preventDefault();
          const didMove = moveColumnBlock(view, draggedBlock, event);
          draggedBlock = null;
          return didMove;
        },
        dragend() {
          draggedBlock = null;
          return false;
        },
      },
    },
  });
}

function ColumnLayoutView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as ColumnLayoutAttrs;
  const columnCount = attrs.columns === 3 ? 3 : 2;

  return (
    <NodeViewWrapper
      className="not-prose grove-column-layout my-4"
      data-column-count={columnCount}
      data-testid={`grove-column-layout-${columnCount}`}
    >
      <NodeViewContent className="grove-column-layout__content" />
    </NodeViewWrapper>
  );
}

function ColumnView() {
  return (
    <NodeViewWrapper
      className="grove-column"
      data-testid="grove-column"
    >
      <NodeViewContent className="grove-column__content" />
    </NodeViewWrapper>
  );
}

function createColumnContent(columnCount: 2 | 3) {
  return Array.from({ length: columnCount }, () => ({
    type: "groveColumn",
    content: [
      {
        type: "paragraph",
      },
    ],
  }));
}

export const GroveColumn = Node.create({
  name: "groveColumn",
  group: "block",
  content: "block*",
  isolating: true,

  parseHTML() {
    return [{ tag: "div[data-type='grove-column']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "grove-column" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnView);
  },
});

export const ColumnLayoutBlock = Node.create({
  name: "columnLayout",
  group: "block",
  content: "groveColumn{2,3}",
  isolating: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const value = element.getAttribute("data-columns");
          return value === "3" ? 3 : 2;
        },
        renderHTML: (attributes) => ({
          "data-columns": attributes.columns === 3 ? "3" : "2",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='column-layout']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "column-layout" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnLayoutView);
  },

  addProseMirrorPlugins() {
    return [createColumnBlockDragPlugin()];
  },

  addCommands() {
    return {
      insertColumnLayout:
        (attrs?: { columns?: 2 | 3 }) =>
        ({ commands }) => {
          const columns = attrs?.columns === 3 ? 3 : 2;

          return commands.insertContent({
            type: this.name,
            attrs: { columns },
            content: createColumnContent(columns),
          });
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columnLayout: {
      insertColumnLayout: (attrs?: { columns?: 2 | 3 }) => ReturnType;
    };
  }
}
