import { NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { blockActionsPluginKey } from "@/components/editor/extensions/blockActionsPluginKey";
import {
  findBlockById,
  resolveDropPos,
  type BlockPointerCoords,
} from "@/lib/editor/blockUtils";

function dispatchBlockActionsMeta(
  view: EditorView,
  meta: Record<string, unknown>
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
