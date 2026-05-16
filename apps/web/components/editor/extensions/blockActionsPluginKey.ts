import { PluginKey } from "@tiptap/pm/state";

export type BlockActionsState = {
  hoveredBlockId: string | null;
  draggedBlockId: string | null;
  dropPos: number | null;
  flashBlockId: string | null;
};

export const blockActionsPluginKey = new PluginKey<BlockActionsState>("blockActions");
