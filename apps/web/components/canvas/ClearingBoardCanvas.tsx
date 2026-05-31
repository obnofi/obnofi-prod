"use client";

import type { RefObject } from "react";
import type { DraftConnectorApi } from "@/components/canvas/DraftConnectorLayer";
import { DraftConnectorLayer } from "@/components/canvas/DraftConnectorLayer";
import { PenTool } from "@/components/canvas/PenTool";
import { BoardElementRenderer } from "@/components/elements/BoardElementRenderer";
import { EmojiStamp, type FloatingEmojiStamp } from "@/components/elements/EmojiStamp";
import { SelectionBox } from "@/components/elements/SelectionBox";
import { ClearingPresencePanel, PresenceCursor, RemoteAwarenessCursor } from "@/components/canvas/ClearingPresencePanel";
import { ClearingToolbar } from "@/components/toolbar/ClearingToolbar";
import { isImageDrop } from "@/lib/imageUpload";
import { BOARD_WIDTH, BOARD_HEIGHT } from "@/lib/canvas/clearingBoardConstants";
import { useJungleCursor } from "@/lib/cursor/jungleCursor";
import { useCanvasStore } from "@/store/useCanvasStore";
import { Waypoints } from "lucide-react";
import type { Comment, Element, User } from "@obnofi/types/clearing";
import type { ConnectorHandlePosition } from "@/components/elements/ConnectorHandles";

type AwarenessState = {
  userId: string;
  userCursor?: { type: string; pageId?: string; canvasPosition?: { x: number; y: number } | null } | null;
  color: string;
  userName?: string;
  cursorColorKey?: "green" | "leafy" | "blue" | "pink";
  cursorVariant?: "pointing" | "highlighting" | "fucku";
};

type ClearingBoardCanvasProps = {
  boardRef: RefObject<HTMLDivElement | null>;
  draftConnectorApiRef: RefObject<DraftConnectorApi | null>;
  currentUserRef: RefObject<User | null>;
  currentRoomRef: RefObject<{ id: string } | null>;
  lastScenePointRef: RefObject<{ x: number; y: number }>;
  viewport: { x: number; y: number; zoom: number; scale?: number };
  tool: string;
  lineStyle: string;
  elements: Element[];
  renderedElements: Element[];
  elementLookup: Record<string, Element>;
  comments: Comment[];
  selectedIds: string[];
  selectionFrame: { x: number; y: number; width: number; height: number } | null;
  floatingStamps: FloatingEmojiStamp[];
  remoteCanvasCursors: AwarenessState[];
  others: User[];
  currentUser: User | null;
  drawingColor: string;
  drawingStrokeWidth: number;
  uploadingImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  embedded: boolean;
  connectorCursor: { x: number; y: number } | null;
  onDrop: (file: File) => void;
  onContextMenu: (x: number, y: number) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  onElementPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
  onConnectorStart: (event: React.PointerEvent<HTMLButtonElement>, elementId: string, position: ConnectorHandlePosition) => void;
  onVote: (elementId: string) => void;
  onCommentPinClick: (x: number, y: number) => void;
  onPathCreated: (element: Element) => Promise<void>;
  onAddElement: (kind: "sticky" | "connector" | "vine") => void;
  onAddComment: () => void;
  onDrawingColorChange: (color: string) => void;
  onEmojiStampSelect: (emoji: string) => void;
  onLineStyleChange: (style: string) => void;
  onOpenImagePicker: () => void;
  onRedo: () => void;
  onResetViewport: () => void;
  onSetTool: (tool: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
};

export function ClearingBoardCanvas({
  boardRef, draftConnectorApiRef, currentUserRef, currentRoomRef, lastScenePointRef: _lastScenePointRef,
  viewport, tool, elements, renderedElements, elementLookup,
  comments, selectedIds, selectionFrame, floatingStamps,
  remoteCanvasCursors, others, currentUser,
  drawingColor, drawingStrokeWidth, uploadingImage, canUndo, canRedo,
  embedded, connectorCursor,
  onDrop, onContextMenu, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onWheel,
  onElementPointerDown, onConnectorStart, onVote, onCommentPinClick, onPathCreated,
  onAddElement, onAddComment, onDrawingColorChange, onEmojiStampSelect,
  onLineStyleChange, onOpenImagePicker, onRedo, onResetViewport, onSetTool,
  onStrokeWidthChange, onUndo,
}: ClearingBoardCanvasProps) {
  void _lastScenePointRef;
  const jungleCursor = useJungleCursor();

  return (
    <>
      <ClearingPresencePanel currentUser={currentUser} others={others} />

      <div
        ref={boardRef}
        className="absolute inset-0 overflow-hidden"
        style={{ cursor: jungleCursor.cursorCss }}
        onDragOver={(e) => { if (isImageDrop(e.dataTransfer)) e.preventDefault(); }}
        onDrop={(e) => {
          if (!boardRef.current || !isImageDrop(e.dataTransfer)) return;
          e.preventDefault();
          const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
          if (file) onDrop(file);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (selectedIds.length === 0) return;
          onContextMenu(e.clientX, e.clientY);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onWheel={onWheel}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: "var(--color-board-surface)",
            backgroundImage: "linear-gradient(to right, var(--color-board-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--color-board-grid) 1px, transparent 1px)",
            backgroundSize: `${32 * viewport.zoom}px ${32 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          }}
        />

        {(tool === "pen" || tool === "marker") && (
          <div className="absolute inset-0 z-20 pointer-events-auto">
            <PenTool
              activeTool={tool} boardRef={boardRef} color={drawingColor}
              currentUserId={currentUserRef.current?.id ?? null}
              roomId={currentRoomRef.current?.id ?? null}
              strokeWidth={tool === "marker" ? Math.max(drawingStrokeWidth, 16) : drawingStrokeWidth}
              viewport={viewport} zIndex={elements.length + 1}
              onPathCreated={onPathCreated}
            />
          </div>
        )}

        <DraftConnectorLayer ref={draftConnectorApiRef} />

        <div
          className="pointer-events-none relative"
          style={{
            width: BOARD_WIDTH, height: BOARD_HEIGHT,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "top left",
          }}
        >
          {renderedElements.map((element) => {
            const containingSection = elements.find((e) =>
              e.type === "section" && e.id !== element.id &&
              element.x >= e.x && element.x + element.width <= e.x + e.width &&
              element.y >= e.y && element.y + element.height <= e.y + e.height
            );
            return (
              <BoardElementRenderer
                key={element.id}
                commentCount={comments.filter((c) => c.elementId === element.id).length}
                containingSectionId={containingSection?.id}
                element={element}
                isSectionSelected={containingSection ? selectedIds.includes(containingSection.id) : false}
                isSelected={selectedIds.includes(element.id)}
                linkedElements={elementLookup}
                onPointerDown={onElementPointerDown}
                onConnectorStart={onConnectorStart}
                onVote={onVote}
                scale={viewport.scale}
              />
            );
          })}

          <SelectionBox bounds={selectionFrame} scale={viewport.scale} />

          {comments
            .filter((c) => !c.elementId && typeof c.x === "number" && typeof c.y === "number")
            .map((comment) => (
              <div
                key={comment.id}
                className={`pointer-events-auto absolute flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] px-3 text-xs font-medium shadow-sm ${
                  comment.resolved ? "bg-zinc-200 text-zinc-500" : "bg-[var(--color-surface)]"
                }`}
                style={{ left: comment.x, top: comment.y }}
                onClick={(e) => { e.stopPropagation(); onCommentPinClick(comment.x ?? 0, comment.y ?? 0); }}
              >
                💬
              </div>
            ))}

          {floatingStamps.map((stamp) => <EmojiStamp key={stamp.id} stamp={stamp} />)}

          {remoteCanvasCursors.map((state) => {
            const pos = state.userCursor?.canvasPosition;
            if (!pos) return null;
            return (
              <RemoteAwarenessCursor
                key={state.userId}
                userId={state.userId}
                canvasX={pos.x}
                canvasY={pos.y}
                color={state.color}
                userName={state.userName}
                cursorColorKey={state.cursorColorKey}
                cursorVariant={state.cursorVariant}
              />
            );
          })}

          {others.filter((u) => u.cursor).map((user) => (
            <PresenceCursor key={user.id} user={user} />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
          <ClearingToolbar
            activeTool={tool} canRedo={canRedo} canUndo={canUndo}
            compact={embedded} isUploadingImage={uploadingImage} lineStyle={useCanvasStore.getState().lineStyle}
            onAddComment={onAddComment} onAddElement={onAddElement}
            onDrawingColorChange={onDrawingColorChange} onEmojiStampSelect={onEmojiStampSelect}
            onLineStyleChange={onLineStyleChange}
            onOpenImagePicker={onOpenImagePicker}
            onRedo={onRedo} onResetViewport={onResetViewport} onSetTool={onSetTool}
            onStrokeWidthChange={onStrokeWidthChange} onUndo={onUndo}
            strokeColor={drawingColor} strokeWidth={drawingStrokeWidth}
          />
        </div>

        {tool === "connector" && connectorCursor ? (
          <div
            className="pointer-events-none fixed z-[1000] flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-2 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] shadow-sm backdrop-blur"
            style={{ left: connectorCursor.x + 14, top: connectorCursor.y + 12 }}
          >
            <Waypoints className="h-3 w-3 opacity-55" />
            <span className="opacity-60">draw link</span>
          </div>
        ) : null}
      </div>
    </>
  );
}
