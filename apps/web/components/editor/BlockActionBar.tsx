"use client";

import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import {
  applyBlockDrag,
  endBlockDrag,
  startBlockDrag,
  updateBlockDrag,
} from "@/components/editor/extensions/BlockActionsExtension";
import { blockActionsPluginKey } from "@/components/editor/extensions/blockActionsPluginKey";

interface BlockActionBarProps {
  editor: Editor;
  container: HTMLElement | null;
}

type ActionBarPosition = {
  blockId: string;
  left: number;
  top: number;
};

function readBlockActionState(editor: Editor) {
  const pluginState = blockActionsPluginKey.getState(editor.state);
  return {
    hoveredBlockId: pluginState?.hoveredBlockId ?? null,
    draggedBlockId: pluginState?.draggedBlockId ?? null,
  };
}

export function BlockActionBar({ editor, container }: BlockActionBarProps) {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(
    () => readBlockActionState(editor).hoveredBlockId
  );
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(
    () => readBlockActionState(editor).draggedBlockId
  );
  const [position, setPosition] = useState<ActionBarPosition | null>(null);

  useEffect(() => {
    const update = () => {
      const nextState = readBlockActionState(editor);
      setHoveredBlockId(nextState.hoveredBlockId);
      setDraggedBlockId(nextState.draggedBlockId);
    };

    update();
    editor.on("transaction", update);

    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  useEffect(() => {
    if (!container || !hoveredBlockId || draggedBlockId) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const selector = `[data-grove-block='true'][data-block-id='${CSS.escape(hoveredBlockId)}']`;
      const block = container.querySelector<HTMLElement>(selector);

      if (!block) {
        setPosition(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();

      setPosition({
        blockId: hoveredBlockId,
        left: blockRect.left - containerRect.left - 42,
        top: blockRect.top - containerRect.top + blockRect.height / 2,
      });
    };

    updatePosition();

    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [container, draggedBlockId, hoveredBlockId]);

  const isVisible = useMemo(
    () => !!container && !!position && !!hoveredBlockId && !draggedBlockId,
    [container, draggedBlockId, position, hoveredBlockId]
  );

  if (!isVisible || !position || !hoveredBlockId) {
    return null;
  }

  return (
    <div
      data-block-action-bar="true"
      data-export-ignore="true"
      className="grove-block-action-bar"
      style={{
        left: position.left,
        top: position.top,
      }}
      onMouseEnter={() => {
        setHoveredBlockId(position.blockId);
      }}
      onMouseLeave={() => {
        editor.view.dispatch(
          editor.state.tr.setMeta(blockActionsPluginKey, { hoveredBlockId: null })
        );
      }}
    >
      <button
        type="button"
        className="grove-block-action-button"
        aria-label="블록 이동"
        title="블록 이동"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          const blockId = position.blockId;
          let didMove = false;
          startBlockDrag(editor.view, blockId);

          const cleanup = () => {
            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);
            document.removeEventListener("pointercancel", handlePointerCancel);
          };

          const handlePointerMove = (moveEvent: PointerEvent) => {
            if (
              Math.abs(moveEvent.clientX - event.clientX) > 3 ||
              Math.abs(moveEvent.clientY - event.clientY) > 3
            ) {
              didMove = true;
            }
            updateBlockDrag(editor.view, moveEvent);
          };

          const handlePointerUp = (upEvent: PointerEvent) => {
            cleanup();
            if (didMove) {
              applyBlockDrag(editor.view, upEvent);
            } else {
              endBlockDrag(editor.view);
              editor.commands.selectBlockNode(blockId);
            }
          };

          const handlePointerCancel = () => {
            cleanup();
            endBlockDrag(editor.view);
          };

          document.addEventListener("pointermove", handlePointerMove);
          document.addEventListener("pointerup", handlePointerUp, { once: true });
          document.addEventListener("pointercancel", handlePointerCancel, { once: true });
        }}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}
