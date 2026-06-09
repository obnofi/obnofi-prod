import { useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { DraftConnectorApi } from "@/components/canvas/DraftConnectorLayer";
import type { DragState, DrawState, LassoState, PanState, ClearingSaveStatus } from "@/lib/canvas/clearingBoardTypes";
import { type FloatingEmojiStamp } from "@/components/elements/EmojiStamp";
import { useCanvasStore } from "@/store/useCanvasStore";
import type { Comment, Element, Room, User } from "@obnofi/types/clearing";

/**
 * All refs and local state for ClearingBoard, extracted to reduce component line count.
 */
export function useClearingBoardState(title?: string) {
  // DOM / interaction refs
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStateRef = useRef<DragState>(null);
  const panStateRef = useRef<PanState>(null);
  const drawStateRef = useRef<DrawState>(null);
  const lassoStateRef = useRef<LassoState>(null);
  const draftConnectorApiRef = useRef<DraftConnectorApi | null>(null);
  const lastScenePointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastCursorSyncRef = useRef(0);
  const viewportRef = useRef(useCanvasStore.getState().viewport);
  const dragUpdateFrameRef = useRef<number | null>(null);
  const pendingDragPatchesRef = useRef<Record<string, Partial<Element>> | null>(null);

  // Supabase / collaboration refs
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelReadyRef = useRef(false);
  const currentRoomRef = useRef<Room | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const clearingOriginIdRef = useRef(crypto.randomUUID());
  const skipRemoteUpsertsRef = useRef<Map<string, string>>(new Map());
  const skipRemoteDeletesRef = useRef<Set<string>>(new Set());

  // Persistence refs
  const previousElementsRef = useRef<Element[]>([]);
  const suppressPersistenceRef = useRef(false);
  const latestCommentsRef = useRef<Comment[]>([]);
  const persistTimerRef = useRef<number | null>(null);
  const pendingUpsertsRef = useRef<Map<string, Element>>(new Map());
  const pendingDeletesRef = useRef<Set<string>>(new Set());

  // Component state
  const [room, setRoom] = useState<Room | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [saveStatus, setSaveStatus] = useState<ClearingSaveStatus>("saved");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#2E7D45");
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(2);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [embedDraftUrl, setEmbedDraftUrl] = useState<string | null>(null);
  const [activeEmojiStamp, setActiveEmojiStamp] = useState<string | null>(null);
  const [floatingStamps, setFloatingStamps] = useState<FloatingEmojiStamp[]>([]);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title ?? "");
  const [propertyPanelElementId, setPropertyPanelElementId] = useState<string | null>(null);
  const [activeThreadTarget, setActiveThreadTarget] = useState<{
    elementId: string | null;
    x: number;
    y: number;
  } | null>(null);
  const [connectorCursor, setConnectorCursor] = useState<{ x: number; y: number } | null>(null);

  return {
    // DOM refs
    boardRef, fileInputRef, draftConnectorApiRef, lastScenePointRef, lastCursorSyncRef, viewportRef,
    dragUpdateFrameRef, pendingDragPatchesRef,
    // Interaction refs
    dragStateRef, panStateRef, drawStateRef, lassoStateRef,
    // Collaboration refs
    presenceChannelRef, presenceChannelReadyRef, currentRoomRef, currentUserRef,
    clearingOriginIdRef, skipRemoteUpsertsRef, skipRemoteDeletesRef,
    // Persistence refs
    previousElementsRef, suppressPersistenceRef, latestCommentsRef,
    persistTimerRef, pendingUpsertsRef, pendingDeletesRef,
    // State
    room, setRoom,
    comments, setComments,
    isBootstrapping, setIsBootstrapping,
    isSupabaseLive, setIsSupabaseLive,
    saveStatus, setSaveStatus,
    uploadingImage, setUploadingImage,
    drawingColor, setDrawingColor,
    drawingStrokeWidth, setDrawingStrokeWidth,
    contextMenu, setContextMenu,
    embedDraftUrl, setEmbedDraftUrl,
    activeEmojiStamp, setActiveEmojiStamp,
    floatingStamps, setFloatingStamps,
    isTitleEditing, setIsTitleEditing,
    titleDraft, setTitleDraft,
    propertyPanelElementId, setPropertyPanelElementId,
    activeThreadTarget, setActiveThreadTarget,
    connectorCursor, setConnectorCursor,
  };
}
