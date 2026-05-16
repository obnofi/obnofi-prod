"use client";

import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import {
  blockActionsPluginKey,
  type BlockActionsState,
} from "@/components/editor/extensions/blockActionsPluginKey";

type ActionableBlockInfo = {
  id: string;
  pos: number;
  node: ProseMirrorNode;
  parentNode: ProseMirrorNode;
  parentPos: number;
};

type BlockActionsMeta = Partial<BlockActionsState>;
type BlockPointerCoords = {
  clientX: number;
  clientY: number;
};

const actionableParentNames = new Set([
  "doc",
  "groveColumn",
  "bulletList",
  "orderedList",
]);

const actionableNodeNames = [
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "horizontalRule",
  "codeBlock",
  "databaseNode",
  "dbDiagram",
  "canvasEmbed",
  "buttonBlock",
  "linkedDatabaseEmbed",
  "githubEmbedBlock",
  "linkEmbedBlock",
  "webClipBlock",
  "fileDropBlock",
  "groveTableBlock",
  "mathBlock",
  "subPageEmbed",
  "columnLayout",
];

function isWithinBlockHoverBuffer(
  view: EditorView,
  blockId: string,
  event: MouseEvent
) {
  const block = view.dom.querySelector<HTMLElement>(
    `[data-grove-block='true'][data-block-id='${CSS.escape(blockId)}']`
  );

  if (!block) {
    return false;
  }

  const rect = block.getBoundingClientRect();

  return (
    event.clientX >= rect.left - 128 &&
    event.clientX <= rect.right + 16 &&
    event.clientY >= rect.top - 12 &&
    event.clientY <= rect.bottom + 12
  );
}

function createBlockId() {
  return `block-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureBlockIds(doc: ProseMirrorNode, tr: Transaction) {
  const seenBlockIds = new Set<string>();
  let didChange = false;

  doc.descendants((node, pos, parent) => {
    if (!isActionableBlock(node, parent ?? null)) {
      return;
    }

    const blockId = String(node.attrs.blockId ?? "");
    if (!blockId || seenBlockIds.has(blockId)) {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        blockId: createBlockId(),
      });
      didChange = true;
      return;
    }

    seenBlockIds.add(blockId);
  });

  return didChange;
}

function isActionableBlock(
  node: ProseMirrorNode,
  parent: ProseMirrorNode | null
) {
  return node.isBlock && !!parent && actionableParentNames.has(parent.type.name);
}

function findBlockById(
  doc: ProseMirrorNode,
  blockId: string
): ActionableBlockInfo | null {
  let match: ActionableBlockInfo | null = null;

  doc.descendants((node, pos, parent) => {
    if (!isActionableBlock(node, parent ?? null)) {
      return;
    }

    if (node.attrs.blockId !== blockId) {
      return;
    }

    const $pos = doc.resolve(pos);

    match = {
      id: blockId,
      pos,
      node,
      parentNode: parent ?? doc,
      parentPos: $pos.depth > 1 ? $pos.before($pos.depth - 1) : 0,
    };

    return false;
  });

  return match;
}

function findBlockByElement(
  view: EditorView,
  element: HTMLElement | null
): ActionableBlockInfo | null {
  const blockElement = element?.closest<HTMLElement>("[data-grove-block='true']") ?? null;
  const blockId = blockElement?.dataset.blockId ?? "";

  if (!blockId) {
    return null;
  }

  return findBlockById(view.state.doc, blockId);
}

function findBlockNearGutter(
  view: EditorView,
  point: BlockPointerCoords
): ActionableBlockInfo | null {
  const blockElements = Array.from(
    view.dom.querySelectorAll<HTMLElement>("[data-grove-block='true'][data-block-id]")
  );
  let bestMatch: { distance: number; block: ActionableBlockInfo } | null = null;

  for (const blockElement of blockElements) {
    const rect = blockElement.getBoundingClientRect();
    const withinVerticalRange =
      point.clientY >= rect.top - 14 && point.clientY <= rect.bottom + 14;
    const withinHorizontalRange =
      point.clientX >= rect.left - 132 && point.clientX <= rect.right + 24;

    if (!withinVerticalRange || !withinHorizontalRange) {
      continue;
    }

    const block = findBlockByElement(view, blockElement);
    if (!block) {
      continue;
    }

    const distance = Math.abs(point.clientY - (rect.top + rect.height / 2));

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { distance, block };
    }
  }

  return bestMatch?.block ?? null;
}

function findHoverableBlock(
  view: EditorView,
  point: BlockPointerCoords
) {
  const domTarget =
    typeof document !== "undefined"
      ? document.elementFromPoint(point.clientX, point.clientY)
      : null;

  return (
    findBlockByElement(
      view,
      domTarget instanceof HTMLElement ? domTarget : domTarget?.parentElement ?? null
    ) ?? findBlockNearGutter(view, point)
  );
}

function cloneJsonWithFreshBlockIds(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonWithFreshBlockIds(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    const nodeType =
      typeof record.type === "string" ? record.type : null;

    for (const [key, entry] of Object.entries(record)) {
      if (
        key === "attrs" &&
        entry &&
        typeof entry === "object" &&
        nodeType &&
        actionableNodeNames.includes(nodeType)
      ) {
        next[key] = {
          ...(entry as Record<string, unknown>),
          blockId: createBlockId(),
        };
        continue;
      }

      next[key] = cloneJsonWithFreshBlockIds(entry);
    }

    if (nodeType && actionableNodeNames.includes(nodeType) && !("attrs" in next)) {
      next.attrs = { blockId: createBlockId() };
    }

    return next;
  }

  return value;
}

type BlockSiblingEntry = {
  block: ActionableBlockInfo;
  rect: DOMRect;
};

function getSiblingEntries(
  view: EditorView,
  source: ActionableBlockInfo
): BlockSiblingEntry[] {
  const blockElements = Array.from(
    view.dom.querySelectorAll<HTMLElement>("[data-grove-block='true'][data-block-id]")
  );
  const siblings: BlockSiblingEntry[] = [];

  for (const blockElement of blockElements) {
    const block = findBlockByElement(view, blockElement);
    if (!block || block.parentPos !== source.parentPos) {
      continue;
    }

    siblings.push({
      block,
      rect: blockElement.getBoundingClientRect(),
    });
  }

  siblings.sort((left, right) => left.block.pos - right.block.pos);
  return siblings;
}

function resolveDropPos(
  view: EditorView,
  source: ActionableBlockInfo,
  point: BlockPointerCoords
) {
  const siblings = getSiblingEntries(view, source);

  if (siblings.length === 0) {
    return null;
  }

  const minLeft = Math.min(...siblings.map(({ rect }) => rect.left)) - 96;
  const maxRight = Math.max(...siblings.map(({ rect }) => rect.right)) + 24;

  if (point.clientX < minLeft || point.clientX > maxRight) {
    return null;
  }

  for (const { block, rect } of siblings) {
    if (point.clientY <= rect.top + rect.height / 2) {
      return block.pos;
    }
  }

  const lastSibling = siblings.at(-1);
  return lastSibling ? lastSibling.block.pos + lastSibling.block.node.nodeSize : null;
}

function dispatchBlockActionsMeta(
  view: EditorView,
  meta: BlockActionsMeta
) {
  view.dispatch(view.state.tr.setMeta(blockActionsPluginKey, meta));
}

export function startBlockDrag(
  view: EditorView,
  blockId: string,
  event?: DragEvent
) {
  const block = findBlockById(view.state.doc, blockId);

  if (!block) {
    return;
  }

  view.dispatch(
    view.state.tr
      .setSelection(NodeSelection.create(view.state.doc, block.pos))
      .setMeta(blockActionsPluginKey, {
        draggedBlockId: blockId,
        hoveredBlockId: blockId,
      })
  );

  event?.dataTransfer?.setData("text/plain", blockId);
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    const dragGhost = document.createElement("div");
    dragGhost.style.width = "1px";
    dragGhost.style.height = "1px";
    dragGhost.style.opacity = "0";
    document.body.appendChild(dragGhost);
    event.dataTransfer.setDragImage(dragGhost, 0, 0);
    window.setTimeout(() => {
      dragGhost.remove();
    }, 0);
  }
}

export function updateBlockDrag(view: EditorView, point: BlockPointerCoords) {
  const pluginState = blockActionsPluginKey.getState(view.state);
  const draggedBlockId = pluginState?.draggedBlockId;

  if (!draggedBlockId) {
    return false;
  }

  const source = findBlockById(view.state.doc, draggedBlockId);
  if (!source) {
    return false;
  }

  const dropPos = resolveDropPos(view, source, point);

  if (dropPos === null) {
    if (pluginState?.dropPos !== null) {
      dispatchBlockActionsMeta(view, { dropPos: null });
    }
    return false;
  }

  if (pluginState?.dropPos !== dropPos) {
    dispatchBlockActionsMeta(view, { dropPos });
  }

  return true;
}

export function applyBlockDrag(view: EditorView, point: BlockPointerCoords) {
  const pluginState = blockActionsPluginKey.getState(view.state);
  const draggedBlockId = pluginState?.draggedBlockId;

  if (!draggedBlockId) {
    return false;
  }

  const source = findBlockById(view.state.doc, draggedBlockId);
  if (!source) {
    return false;
  }

  const dropPos = resolveDropPos(view, source, point);
  if (dropPos === null) {
    endBlockDrag(view);
    return false;
  }

  const sourceStart = source.pos;
  const sourceEnd = source.pos + source.node.nodeSize;

  if (dropPos >= sourceStart && dropPos <= sourceEnd) {
    endBlockDrag(view);
    return true;
  }

  const insertPos = sourceStart < dropPos ? dropPos - source.node.nodeSize : dropPos;

  view.dispatch(
    view.state.tr
      .delete(sourceStart, sourceEnd)
      .insert(insertPos, source.node)
      .setMeta(blockActionsPluginKey, {
        draggedBlockId: null,
        dropPos: null,
        hoveredBlockId: source.id,
      })
      .scrollIntoView()
  );
  view.focus();

  return true;
}

export function endBlockDrag(view: EditorView) {
  dispatchBlockActionsMeta(view, {
    draggedBlockId: null,
    dropPos: null,
  });
}

function createBlockActionsPlugin() {
  let flashTimer: number | null = null;

  return new Plugin<BlockActionsState>({
    key: blockActionsPluginKey,
    state: {
      init() {
        return {
          hoveredBlockId: null,
          draggedBlockId: null,
          dropPos: null,
          flashBlockId: null,
        };
      },
      apply(tr, value) {
        const meta = tr.getMeta(blockActionsPluginKey) as BlockActionsMeta | undefined;
        const nextValue = { ...value };

        if (tr.docChanged && nextValue.dropPos !== null) {
          const mappedDropPos = tr.mapping.mapResult(nextValue.dropPos, -1);
          nextValue.dropPos =
            mappedDropPos.deleted || mappedDropPos.pos > tr.doc.content.size
              ? null
              : Math.max(0, mappedDropPos.pos);
        }

        if (!meta) {
          return nextValue;
        }

        return {
          ...nextValue,
          ...meta,
        };
      },
    },
    appendTransaction(_transactions, _oldState, newState) {
      const tr = newState.tr;
      const didChange = ensureBlockIds(newState.doc, tr);
      return didChange ? tr : null;
    },
    props: {
      decorations(state) {
        const pluginState = blockActionsPluginKey.getState(state);
        const decorations: Decoration[] = [];

        state.doc.descendants((node, pos, parent) => {
          if (!isActionableBlock(node, parent ?? null)) {
            return;
          }

          const blockId = String(node.attrs.blockId ?? "");
          const classes = ["grove-editor-block"];

          if (pluginState?.hoveredBlockId === blockId) {
            classes.push("is-hovered");
          }

          if (pluginState?.flashBlockId === blockId) {
            classes.push("is-flashing");
          }

          if (
            pluginState?.dropPos !== null &&
            pluginState?.dropPos !== undefined &&
            pluginState.dropPos >= pos &&
            pluginState.dropPos <= pos + node.nodeSize
          ) {
            classes.push("is-drop-target");
          }

          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: classes.join(" "),
              "data-grove-block": "true",
              "data-block-id": blockId,
              "data-block-pos": String(pos),
            })
          );
        });

        if (
          pluginState?.dropPos !== null &&
          pluginState?.dropPos !== undefined &&
          pluginState.dropPos >= 0 &&
          pluginState.dropPos <= state.doc.content.size
        ) {
          decorations.push(
            Decoration.widget(
              pluginState.dropPos,
              () => {
                const line = document.createElement("div");
                line.className = "grove-block-drop-line";
                return line;
              },
              { side: -1 }
            )
          );
        }

        return DecorationSet.create(state.doc, decorations);
      },
      handleDOMEvents: {
        mousemove(view, event) {
          const pluginState = blockActionsPluginKey.getState(view.state);
          if (pluginState?.draggedBlockId) {
            return false;
          }

          const hoverBlock = findHoverableBlock(view, event);

          if (!hoverBlock) {
            if (
              pluginState?.hoveredBlockId &&
              isWithinBlockHoverBuffer(view, pluginState.hoveredBlockId, event)
            ) {
              return false;
            }

            if (pluginState?.hoveredBlockId) {
              dispatchBlockActionsMeta(view, { hoveredBlockId: null });
            }
            return false;
          }

          if (pluginState?.hoveredBlockId !== hoverBlock.id) {
            dispatchBlockActionsMeta(view, { hoveredBlockId: hoverBlock.id });
          }

          return false;
        },
        mouseleave(view, event) {
          const relatedTarget = event.relatedTarget;
          if (
            relatedTarget instanceof HTMLElement &&
            relatedTarget.closest("[data-block-action-bar='true']")
          ) {
            return false;
          }

          const pluginState = blockActionsPluginKey.getState(view.state);
          if (pluginState?.hoveredBlockId) {
            dispatchBlockActionsMeta(view, { hoveredBlockId: null });
          }

          return false;
        },
        dragover(view, event) {
          if (!blockActionsPluginKey.getState(view.state)?.draggedBlockId) {
            return false;
          }

          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }
          return updateBlockDrag(view, event);
        },
        drop(view, event) {
          if (!blockActionsPluginKey.getState(view.state)?.draggedBlockId) {
            return false;
          }

          event.preventDefault();
          return applyBlockDrag(view, event);
        },
        dragend(view) {
          endBlockDrag(view);
          return false;
        },
      },
    },
    view() {
      return {
        update(updatedView) {
          const pluginState = blockActionsPluginKey.getState(updatedView.state);

          if (!pluginState?.flashBlockId) {
            return;
          }

          if (flashTimer !== null) {
            window.clearTimeout(flashTimer);
          }

          flashTimer = window.setTimeout(() => {
            dispatchBlockActionsMeta(updatedView, { flashBlockId: null });
          }, 900);
        },
        destroy() {
          if (flashTimer !== null) {
            window.clearTimeout(flashTimer);
          }
        },
      };
    },
  });
}

export const BlockActionsExtension = Extension.create({
  name: "blockActions",

  onCreate() {
    const tr = this.editor.state.tr;
    const didChange = ensureBlockIds(this.editor.state.doc, tr);

    if (didChange) {
      this.editor.view.dispatch(tr);
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: actionableNodeNames,
        attributes: {
          blockId: {
            default: null,
            renderHTML: (attributes: Record<string, unknown>) => {
              const blockId = attributes.blockId;
              return blockId ? { "data-block-id": String(blockId) } : {};
            },
            parseHTML: (element: HTMLElement) => element.getAttribute("data-block-id"),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      duplicateBlockNode:
        (blockId: string) =>
        ({ state, dispatch }) => {
          const block = findBlockById(state.doc, blockId);
          if (!block) {
            return false;
          }

          const clonedJson = cloneJsonWithFreshBlockIds(block.node.toJSON()) as Record<
            string,
            unknown
          >;
          const nextBlockId =
            clonedJson &&
            typeof clonedJson === "object" &&
            "attrs" in clonedJson &&
            clonedJson.attrs &&
            typeof clonedJson.attrs === "object"
              ? String((clonedJson.attrs as Record<string, unknown>).blockId ?? "")
              : "";

          const duplicatedNode = state.schema.nodeFromJSON(clonedJson);

          dispatch(
            state.tr
              .insert(block.pos + block.node.nodeSize, duplicatedNode)
              .setMeta(blockActionsPluginKey, {
                flashBlockId: nextBlockId || null,
                hoveredBlockId: nextBlockId || blockId,
              })
              .scrollIntoView()
          );

          return true;
        },
      selectBlockNode:
        (blockId: string) =>
        ({ state, dispatch }) => {
          const block = findBlockById(state.doc, blockId);
          if (!block) {
            return false;
          }

          dispatch(
            state.tr
              .setSelection(NodeSelection.create(state.doc, block.pos))
              .setMeta(blockActionsPluginKey, {
                hoveredBlockId: blockId,
                draggedBlockId: null,
                dropPos: null,
              })
              .scrollIntoView()
          );

          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [createBlockActionsPlugin()];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockActions: {
      duplicateBlockNode: (blockId: string) => ReturnType;
      selectBlockNode: (blockId: string) => ReturnType;
    };
  }
}
