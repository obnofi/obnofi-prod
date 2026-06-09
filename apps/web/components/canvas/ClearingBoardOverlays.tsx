"use client";

import { CommentThread } from "@/components/elements/CommentThread";
import { ContextMenu } from "@/components/elements/contextMenu";
import { ClearingEmbedModal } from "@/components/canvas/ClearingEmbedModal";
import type { Comment, Element } from "@obnofi/types/clearing";

type ContextMenuState = { x: number; y: number } | null;
type ThreadTarget = { elementId: string | null; x: number; y: number } | null;

type ClearingBoardOverlaysProps = {
  contextMenu: ContextMenuState;
  canOpenProperties: boolean;
  onContextBringForward: () => void;
  onContextDelete: () => void;
  onContextOpenProperties: () => void;
  onContextSendBackward: () => void;

  activeThreadTarget: ThreadTarget;
  comments: Comment[];
  viewportX: number;
  viewportY: number;
  onCloseThread: () => void;
  onReplyThread: (content: string, parentId?: string | null) => void;
  onResolveThread: () => void;

  embedDraftUrl: string | null;
  onEmbedUrlChange: (url: string) => void;
  onEmbedConfirm: () => void;
  onEmbedCancel: () => void;

  selectedIds: string[];
  elementLookup: Record<string, Element>;
  updateElement: (id: string, patch: Partial<Element>) => void;
  pushHistory: (snapshot?: Element[]) => void;
  removeElement: (id: string) => void;
  clearSelection: () => void;
};

export function ClearingBoardOverlays({
  contextMenu,
  canOpenProperties,
  onContextBringForward,
  onContextDelete,
  onContextOpenProperties,
  onContextSendBackward,
  activeThreadTarget,
  comments,
  viewportX,
  viewportY,
  onCloseThread,
  onReplyThread,
  onResolveThread,
  embedDraftUrl,
  onEmbedUrlChange,
  onEmbedConfirm,
  onEmbedCancel,
}: ClearingBoardOverlaysProps) {
  return (
    <>
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onBringForward={onContextBringForward}
          onDelete={onContextDelete}
          onOpenProperties={onContextOpenProperties}
          onSendBackward={onContextSendBackward}
          showProperties={canOpenProperties}
        />
      ) : null}

      {activeThreadTarget ? (
        <CommentThread
          comments={comments.filter((c) => {
            if (c.elementId !== activeThreadTarget.elementId) return false;
            if (c.elementId) return true;
            return c.x === activeThreadTarget.x && c.y === activeThreadTarget.y;
          })}
          x={activeThreadTarget.elementId ? activeThreadTarget.x : activeThreadTarget.x + viewportX}
          y={activeThreadTarget.elementId ? activeThreadTarget.y : activeThreadTarget.y + viewportY}
          onClose={onCloseThread}
          onReply={onReplyThread}
          onResolve={onResolveThread}
        />
      ) : null}

      {embedDraftUrl ? (
        <ClearingEmbedModal
          url={embedDraftUrl}
          onUrlChange={onEmbedUrlChange}
          onConfirm={onEmbedConfirm}
          onCancel={onEmbedCancel}
        />
      ) : null}
    </>
  );
}
