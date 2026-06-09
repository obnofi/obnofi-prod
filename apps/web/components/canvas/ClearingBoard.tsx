"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { ClearingBoardCanvas } from "@/components/canvas/ClearingBoardCanvas";
import { ClearingBoardOverlays } from "@/components/canvas/ClearingBoardOverlays";
import { PropertiesPanel } from "@/components/elements/PropertiesPanel";
import { ClearingTitleControl } from "@/components/canvas/ClearingTitleControl";
import {
  buildSessionUserProfile,
  clampZoom,
  getClearingSaveLabel,
  getLocalUser,
} from "@/lib/canvas/clearingBoardUtils";
import { useClearingBoardState } from "@/hooks/useClearingBoardState";
import { useClearingSync } from "@/hooks/useClearingSync";
import { useClearingKeyboard } from "@/hooks/useClearingKeyboard";
import { useClearingPointerHandlers } from "@/hooks/useClearingPointerHandlers";
import { useClearingActions } from "@/hooks/useClearingActions";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useElementStore } from "@/store/useElementStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useUserStore } from "@/store/useUserStore";

export function ClearingBoard({
  embedded = false,
  realtimeEnabled = true,
  roomSlug,
  title,
  onTitleChange,
}: {
  embedded?: boolean;
  realtimeEnabled?: boolean;
  roomSlug: string;
  title?: string;
  onTitleChange?: (title: string) => void;
}) {
  const { data: session } = useSession();
  const collaboration = useCollaboration();
  const awarenessStates = Array.isArray(collaboration.awarenessStates) ? collaboration.awarenessStates : [];
  const updateCursor = collaboration.updateCursor ?? (() => {});
  const localUserId = collaboration.localUserId ?? null;

  const s = useClearingBoardState(title);

  const {
    viewport, tool, lineStyle, selectedElementId,
    setViewport, setTool, setSelectedElement, resetViewport,
  } = useCanvasStore();
  const {
    elements, past, future,
    addElement, updateElement, updateElements,
    removeElement, pushHistory, undo, redo,
  } = useElementStore();
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const clearingTitle = title ?? s.room?.name ?? "Jungle Clearing";
  const {
    clearSelection, selectedIds, selectSingle,
    selectionBounds, setSelectedIds, setSelectionBounds, toggleSelectedId,
  } = useSelectionStore();
  const { currentUser, others, setCurrentUser } = useUserStore();
  const currentUserId = currentUser?.id ?? null;

  const elementLookup = useMemo(() => Object.fromEntries(elements.map((e) => [e.id, e])), [elements]);
  const propertyPanelElement = useMemo(() => {
    if (!s.propertyPanelElementId) return null;
    return elementLookup[s.propertyPanelElementId] ?? null;
  }, [elementLookup, s.propertyPanelElementId]);
  const canOpenProperties = propertyPanelElement?.type === "shape" || propertyPanelElement?.type === "connector"
    ? true
    : (() => {
        const targetId = selectedElementId ?? selectedIds[0] ?? null;
        if (!targetId) return false;
        const target = elementLookup[targetId];
        return target?.type === "shape" || target?.type === "connector";
      })();
  const remoteCanvasCursors = useMemo(
    () => awarenessStates.filter(
      (st) => st.userId !== localUserId && st.userCursor?.type === "canvas" &&
        st.userCursor.pageId === roomSlug && st.userCursor.canvasPosition
    ),
    [awarenessStates, localUserId, roomSlug]
  );
  const selectionFrame = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const sel = elements.filter((e) => selectedIds.includes(e.id));
    if (sel.length === 0) return null;
    return {
      x: Math.min(...sel.map((e) => e.x)),
      y: Math.min(...sel.map((e) => e.y)),
      width: Math.max(...sel.map((e) => e.x + e.width)) - Math.min(...sel.map((e) => e.x)),
      height: Math.max(...sel.map((e) => e.y + e.height)) - Math.min(...sel.map((e) => e.y)),
    };
  }, [elements, selectedIds]);

  useEffect(() => {
    const localUser = session?.user ? buildSessionUserProfile(session.user) : getLocalUser();
    if (typeof window !== "undefined") window.localStorage.setItem("obnofi-clearing-user", JSON.stringify(localUser));
    s.currentUserRef.current = localUser;
    setCurrentUser(localUser);
  }, [session, setCurrentUser, s.currentUserRef]);

  useEffect(() => { s.latestCommentsRef.current = s.comments; }, [s.comments, s.latestCommentsRef]);
  useEffect(() => { s.viewportRef.current = viewport; }, [viewport, s.viewportRef]);
  useEffect(() => { if (!s.isTitleEditing) s.setTitleDraft(clearingTitle); }, [clearingTitle, s.isTitleEditing, s.setTitleDraft]);
  useEffect(() => {
    updateCursor({ type: "canvas", pageId: roomSlug, canvasPosition: null, databaseCell: null });
    return () => { updateCursor(null); };
  }, [roomSlug, updateCursor]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      s.setFloatingStamps((c) => {
        if (c.length === 0) return c;
        const now = Date.now();
        const next = c.filter((st) => now - st.createdAt < 3000);
        return next.length === c.length ? c : next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [s.setFloatingStamps]);

  const { persistElement } = useClearingSync({
    roomSlug, embedded, realtimeEnabled, currentUserId, elements,
    state: s, clearSelection, resetViewport, setSelectedElement,
  });

  useClearingKeyboard({
    selectedIds, clearSelection, setSelectedElement,
    pushHistory, removeElement, undo, redo, setEmbedDraftUrl: s.setEmbedDraftUrl,
  });

  const pointerHandlers = useClearingPointerHandlers({
    boardRef: s.boardRef, dragStateRef: s.dragStateRef, dragUpdateFrameRef: s.dragUpdateFrameRef,
    pendingDragPatchesRef: s.pendingDragPatchesRef, panStateRef: s.panStateRef,
    drawStateRef: s.drawStateRef, lassoStateRef: s.lassoStateRef,
    lastScenePointRef: s.lastScenePointRef, viewportRef: s.viewportRef,
    draftConnectorApiRef: s.draftConnectorApiRef,
    currentRoomRef: s.currentRoomRef, currentUserRef: s.currentUserRef,
    presenceChannelRef: s.presenceChannelRef, lastCursorSyncRef: s.lastCursorSyncRef,
    viewport, elements, elementLookup, selectedIds, selectedElementId,
    tool, lineStyle, activeEmojiStamp: s.activeEmojiStamp, selectionBounds,
    setViewport, setPropertyPanelElementId: s.setPropertyPanelElementId, setSelectedElement, setTool,
    setContextMenu: s.setContextMenu, setActiveThreadTarget: s.setActiveThreadTarget,
    setConnectorCursor: s.setConnectorCursor, setActiveEmojiStamp: s.setActiveEmojiStamp,
    setFloatingStamps: s.setFloatingStamps, setSelectionBounds, setSelectedIds,
    clearSelection, selectSingle, toggleSelectedId,
    addElement, updateElement, updateElements, pushHistory, persistElement,
  });

  const actions = useClearingActions({
    currentRoomRef: s.currentRoomRef, currentUserRef: s.currentUserRef,
    elements, isSupabaseLive: s.isSupabaseLive, activeThreadTarget: s.activeThreadTarget,
    setComments: s.setComments, setUploadingImage: s.setUploadingImage,
    setEmbedDraftUrl: s.setEmbedDraftUrl, setTool,
    addElement, selectSingle, setSelectedElement, updateElement,
    pushHistory, persistElement, elementLookup,
  });

  const handleElementContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, elementId: string) => {
      event.preventDefault();
      event.stopPropagation();
      selectSingle(elementId);
      setSelectedElement(elementId);
      s.setContextMenu({ x: event.clientX, y: event.clientY });
    },
    [s, selectSingle, setSelectedElement]
  );

  const commitClearingTitle = useCallback(() => {
    const nextTitle = s.titleDraft.trim() || "Jungle Clearing";
    s.setIsTitleEditing(false); s.setTitleDraft(nextTitle);
    if (nextTitle !== clearingTitle) onTitleChange?.(nextTitle);
  }, [clearingTitle, onTitleChange, s.titleDraft, s.setIsTitleEditing, s.setTitleDraft]);

  const cancelClearingTitleEdit = useCallback(() => {
    s.setIsTitleEditing(false); s.setTitleDraft(clearingTitle);
  }, [clearingTitle, s.setIsTitleEditing, s.setTitleDraft]);

  const titleControlProps = {
    title: clearingTitle, isEditing: s.isTitleEditing, titleDraft: s.titleDraft,
    onTitleDraftChange: s.setTitleDraft, onCommit: commitClearingTitle,
    onCancel: cancelClearingTitleEdit, onStartEditing: () => s.setIsTitleEditing(true),
  };

  const overlayProps = {
    contextMenu: s.contextMenu,
    canOpenProperties,
    onContextBringForward: () => { selectedIds.forEach((id) => { const t = elementLookup[id]; if (t) updateElement(id, { zIndex: t.zIndex + 1 }); }); s.setContextMenu(null); },
    onContextDelete: () => { pushHistory(); selectedIds.forEach((id) => removeElement(id)); clearSelection(); s.setContextMenu(null); },
    onContextOpenProperties: () => {
      const targetId = selectedElementId ?? selectedIds[0] ?? null;
      const target = targetId ? elementLookup[targetId] : null;
      if (target?.type === "shape" || target?.type === "connector") {
        s.setPropertyPanelElementId(target.id);
      }
      s.setContextMenu(null);
    },
    onContextSendBackward: () => { selectedIds.forEach((id) => { const t = elementLookup[id]; if (t) updateElement(id, { zIndex: t.type === "section" ? -1000 : t.zIndex - 1 }); }); s.setContextMenu(null); },
    activeThreadTarget: s.activeThreadTarget, comments: s.comments,
    viewportX: viewport.x, viewportY: viewport.y,
    onCloseThread: () => { s.setActiveThreadTarget(null); setTool("select"); },
    onReplyThread: (content: string, parentId?: string | null) => void actions.submitComment(content, parentId),
    onResolveThread: () => void actions.resolveThread(s.comments),
    embedDraftUrl: s.embedDraftUrl, onEmbedUrlChange: s.setEmbedDraftUrl,
    onEmbedConfirm: () => void actions.handleEmbedCreate(s.embedDraftUrl!),
    onEmbedCancel: () => s.setEmbedDraftUrl(null),
    selectedIds, elementLookup, updateElement, pushHistory, removeElement, clearSelection,
  };

  return (
    <div
      data-testid={embedded ? "inline-canvas" : "workspace-canvas"}
      className={`flex flex-col bg-[var(--color-background)] text-[var(--color-text-primary)] ${embedded ? "h-full" : "min-h-screen"}`}
    >
      {!embedded ? (
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Clearing</p>
              <div className="flex items-center gap-3">
                <ClearingTitleControl {...titleControlProps} />
                <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                  {s.isSupabaseLive ? "Supabase live" : "Local mode"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <span>{elements.length} elements</span>
              <span>{s.comments.length} comments</span>
              <span>{others.length + (currentUser ? 1 : 0)} gardeners</span>
            </div>
          </div>
        </header>
      ) : null}

      <div className={`flex flex-1 gap-4 ${embedded ? "h-full p-0" : "mx-auto w-full max-w-[1600px] px-4 py-4"}`}>
        <main
          className={`relative flex-1 overflow-hidden border border-[var(--color-border)] bg-[var(--color-board-surface)] ${
            embedded ? "h-full rounded-[20px]" : "rounded-[24px] shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
          }`}
        >
          <div className="absolute right-4 top-4 z-30 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-1 text-[11px] text-[var(--color-text-secondary)] backdrop-blur">
            {getClearingSaveLabel(s.saveStatus, s.isSupabaseLive)}
          </div>

          {embedded ? (
            <div
              className="absolute left-4 right-28 top-4 z-30 rounded-xl bg-[var(--color-surface)]/90 px-2 py-1 backdrop-blur sm:right-auto sm:max-w-[420px]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ClearingTitleControl {...titleControlProps} />
            </div>
          ) : null}

          <ClearingBoardCanvas
            boardRef={s.boardRef} draftConnectorApiRef={s.draftConnectorApiRef}
            currentUserRef={s.currentUserRef} currentRoomRef={s.currentRoomRef}
            lastScenePointRef={s.lastScenePointRef}
            viewport={viewport} tool={tool} lineStyle={lineStyle}
            elements={elements} elementLookup={elementLookup} comments={s.comments}
            selectedIds={selectedIds} selectionFrame={selectionFrame}
            floatingStamps={s.floatingStamps} remoteCanvasCursors={remoteCanvasCursors}
            others={others} currentUser={currentUser}
            drawingColor={s.drawingColor} drawingStrokeWidth={s.drawingStrokeWidth}
            uploadingImage={s.uploadingImage} canUndo={canUndo} canRedo={canRedo}
            embedded={embedded} connectorCursor={s.connectorCursor}
            onDrop={(file) => void actions.handleImageUpload(file)}
            onContextMenu={(x, y) => s.setContextMenu({ x, y })}
            onPointerDown={pointerHandlers.handleBoardPointerDown}
            onPointerMove={(e) => {
              pointerHandlers.handleBoardPointerMove(e);
              updateCursor({ type: "canvas", pageId: roomSlug, canvasPosition: s.lastScenePointRef.current, databaseCell: null });
            }}
            onPointerUp={() => void pointerHandlers.handleBoardPointerUp()}
            onPointerLeave={() => {
              void pointerHandlers.handleBoardPointerUp();
              if (s.presenceChannelRef.current && s.presenceChannelReadyRef.current && s.currentUserRef.current) {
                const u = { ...s.currentUserRef.current, cursor: undefined, lastSeenAt: new Date().toISOString() };
                s.currentUserRef.current = u; setCurrentUser(u); void s.presenceChannelRef.current.track(u);
              }
              updateCursor({ type: "canvas", pageId: roomSlug, canvasPosition: null, databaseCell: null });
            }}
            onWheel={(e) => {
              if (!s.boardRef.current || !e.metaKey) return;
              e.preventDefault();
              setViewport({ zoom: clampZoom(viewport.zoom - e.deltaY * 0.0012) });
            }}
            onElementContextMenu={handleElementContextMenu}
            onElementPointerDown={pointerHandlers.handleElementPointerDown}
            onConnectorStart={pointerHandlers.handleConnectorHandleStart}
            onVote={actions.handleVote}
            onCommentPinClick={(x, y) => s.setActiveThreadTarget({ elementId: null, x, y })}
            onPathCreated={actions.handlePathCreated}
            onAddElement={actions.handleCreateElement}
            onAddComment={actions.handleCreateComment}
            onDrawingColorChange={s.setDrawingColor}
            onEmojiStampSelect={s.setActiveEmojiStamp}
            onLineStyleChange={useCanvasStore.getState().setLineStyle}
            onOpenImagePicker={() => s.fileInputRef.current?.click()}
            onRedo={redo} onResetViewport={resetViewport} onSetTool={setTool}
            onStrokeWidthChange={s.setDrawingStrokeWidth} onUndo={undo}
          />

          {embedded ? (
            <div className="pointer-events-none absolute bottom-3 right-3 top-14 z-30 flex justify-end overflow-y-auto">
              <div className="pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
                <PropertiesPanel elementId={s.propertyPanelElementId} />
              </div>
            </div>
          ) : null}
        </main>

        {!embedded ? <PropertiesPanel elementId={s.propertyPanelElementId} /> : null}
      </div>

      <ClearingBoardOverlays {...overlayProps} />

      <input
        ref={s.fileInputRef}
        name="clearing-image-upload"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void actions.handleImageUpload(file);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
