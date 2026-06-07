"use client";

import { Extension } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { blockActionsPluginKey } from "@/components/editor/extensions/blockActionsPluginKey";
import {
  actionableNodeNames,
  cloneJsonWithFreshBlockIds,
  ensureBlockIds,
  findBlockById,
} from "@/lib/editor/blockUtils";
import { createBlockActionsPlugin } from "@/lib/editor/blockActionsPlugin";

export { startBlockDrag, updateBlockDrag, applyBlockDrag, endBlockDrag } from "@/lib/editor/blockDragHandlers";

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
        ({ dispatch, view }) => {
          const block = findBlockById(view.state.doc, blockId);
          if (!block) {
            return false;
          }

          // Focus BEFORE dispatch: ensures selectionToDOM runs after the transaction
          // (ProseMirror skips selectionToDOM when view is not focused)
          view.focus();

          dispatch(
            view.state.tr
              .setSelection(NodeSelection.create(view.state.doc, block.pos))
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
