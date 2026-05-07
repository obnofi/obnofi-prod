"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Waypoints } from "lucide-react";
import { useSession } from "next-auth/react";
import { PenTool } from "@/components/canvas/PenTool";
import { BoardElementRenderer } from "@/components/elements/BoardElementRenderer";
import { CommentThread } from "@/components/elements/CommentThread";
import { EmojiStamp, type FloatingEmojiStamp } from "@/components/elements/EmojiStamp";
import { SelectionBox } from "@/components/elements/SelectionBox";
import { ContextMenu } from "@/components/elements/contextMenu";
import { PropertiesPanel } from "@/components/elements/PropertiesPanel";
import { ClearingToolbar } from "@/components/toolbar/ClearingToolbar";
import { createEmbedElement } from "@/lib/embedUtils";
import { createImageElement, isImageDrop, uploadImageToBoard } from "@/lib/imageUpload";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { createDemoComment, createDemoElements, createDemoRoom, createDemoUser } from "@/lib/whiteboard";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useElementStore } from "@/store/useElementStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useUserStore } from "@/store/useUserStore";
import type { Comment, Element, Room, User } from "@obnofi/types/clearing";

const BOARD_WIDTH = 4000;
const BOARD_HEIGHT = 2400;

type DragState = {
  elementId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  groupOrigin: Record<string, { x: number; y: number }>;
  sectionChildOrigins?: Record<string, { x: number; y: number }>;
  preDragSnapshot: Element[];
} | null;

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null;

type DrawState = {
  elementId: string;
  startX: number;
  startY: number;
} | null;

type LassoState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

type LocalClearingSnapshot = {
  room: Room;
  elements: Element[];
  comments: Comment[];
};

type ClearingSaveStatus = "saved" | "saving" | "unsaved" | "error";

function clampZoom(zoom: number) {
  return Math.min(2.4, Math.max(0.35, zoom));
}

function getLocalUser() {
  if (typeof window === "undefined") {
    return createDemoUser();
  }

  const cached = window.localStorage.getItem("obnofi-clearing-user");
  if (cached) {
    return JSON.parse(cached) as User;
  }

  const nextUser = createDemoUser();
  window.localStorage.setItem("obnofi-clearing-user", JSON.stringify(nextUser));
  return nextUser;
}

function resolvePresenceColor(seed: string) {
  const colors = ["fern", "sun", "rose", "sky"] as const;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return colors[hash % colors.length];
}

function buildSessionUserProfile(sessionUser: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const seed = sessionUser.email ?? sessionUser.id ?? sessionUser.name ?? "obnofi";
  return {
    id: sessionUser.id,
    name: sessionUser.name ?? sessionUser.email ?? "Anonymous",
    email: sessionUser.email ?? null,
    avatarUrl: sessionUser.image ?? null,
    color: resolvePresenceColor(seed),
    connectedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  } satisfies User;
}

function getScenePoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewportX: number,
  viewportY: number,
  zoom: number
) {
  return {
    x: (clientX - rect.left - viewportX) / zoom,
    y: (clientY - rect.top - viewportY) / zoom,
  };
}

function getElementCenter(element: Element) {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
}

function toElement(record: Record<string, unknown>): Element {
  return {
    id: record.id as string,
    roomId: record.room_id as string,
    type: record.type as Element["type"],
    x: Number(record.x),
    y: Number(record.y),
    width: Number(record.width),
    height: Number(record.height),
    rotation: Number(record.rotation),
    zIndex: Number(record.z_index),
    createdBy: record.created_by as string,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    style: record.style as Element["style"],
    content: record.content as Element["content"],
  } as Element;
}

function toElementInsert(element: Element) {
  return {
    id: element.id,
    room_id: element.roomId,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    z_index: element.zIndex,
    created_by: element.createdBy,
    style: element.style,
    content: element.content,
    created_at: element.createdAt,
    updated_at: element.updatedAt,
  };
}

function toComment(record: Record<string, unknown>): Comment {
  return {
    id: record.id as string,
    roomId: record.room_id as string,
    elementId: (record.element_id as string | null) ?? null,
    authorId: record.author_id as string,
    body: record.body as string,
    content: (record.content as string | null) ?? (record.body as string),
    parentId: (record.parent_id as string | null) ?? null,
    x: typeof record.x === "number" ? record.x : undefined,
    y: typeof record.y === "number" ? record.y : undefined,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    resolved: Boolean(record.resolved),
    resolvedAt: (record.resolved_at as string | null) ?? undefined,
  };
}

function buildConnectorElement(roomId: string, userId: string, elements: Element[], index: number): Element {
  const firstSticky = elements.find((element) => element.type === "sticky");
  const firstText = elements.find((element) => element.type === "text");
  const fromPoint = firstSticky ? getElementCenter(firstSticky) : { x: 580, y: 270 };
  const toPoint = firstText ? getElementCenter(firstText) : { x: 980, y: 320 };

  return {
    id: crypto.randomUUID(),
    roomId,
    type: "connector",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    zIndex: index,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    style: {
      color: "fern",
      strokeWidth: 3,
      opacity: 1,
    },
    content: {
      kind: "connector",
      arrowStart: false,
      arrowEnd: true,
      lineStyle: "solid",
      start: fromPoint,
      end: toPoint,
      fromElementId: firstSticky?.id,
      toElementId: firstText?.id,
      label: "flow",
    },
  };
}

function buildPathElement(roomId: string, userId: string, index: number): Element {
  return {
    id: crypto.randomUUID(),
    roomId,
    type: "path",
    x: 640,
    y: 520,
    width: 220,
    height: 140,
    rotation: 0,
    zIndex: index,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    style: {
      color: "sky",
      strokeWidth: 5,
      opacity: 1,
    },
    content: {
      kind: "path",
      points: [
        { x: 0, y: 90 },
        { x: 40, y: 20 },
        { x: 95, y: 48 },
        { x: 140, y: 14 },
        { x: 190, y: 110 },
        { x: 220, y: 72 },
      ],
      closed: false,
    },
  };
}

function buildElement(kind: Element["type"], roomId: string, userId: string, index: number, elements: Element[]): Element {
  const timestamp = new Date().toISOString();
  const base = {
    id: crypto.randomUUID(),
    roomId,
    x: 900 + (index % 3) * 48,
    y: 380 + (index % 4) * 40,
    rotation: 0,
    zIndex: index,
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (kind === "sticky") {
    return {
      ...base,
      type: "sticky",
      width: 240,
      height: 210,
      style: {
        color: "sun",
        opacity: 1,
      },
      content: {
        kind: "sticky",
        text: "Map the user journey\nFrame key decisions\nKeep the grove tidy",
        tone: "sun",
      },
    };
  }

  if (kind === "shape") {
    return {
      ...base,
      type: "shape",
      width: 260,
      height: 160,
      style: {
        color: "fern",
        strokeWidth: 2,
        opacity: 1,
      },
      content: {
        kind: "shape",
        shape: "rectangle",
        fill: "mist",
        label: "Decision frame",
      },
    };
  }

  if (kind === "text") {
    return {
      ...base,
      type: "text",
      width: 320,
      height: 72,
      style: {
        color: "ink",
        opacity: 1,
      },
      content: {
        kind: "text",
        text: "Clearing board for workshop notes",
        fontSize: 28,
        align: "left",
        weight: 600,
      },
    };
  }

  if (kind === "path") {
    return buildPathElement(roomId, userId, index);
  }

  return buildConnectorElement(roomId, userId, elements, index);
}

function logClearingPersistenceError(scope: string, error: unknown) {
  console.error(`[ClearingBoard] ${scope}`, error);
}

function getClearingSaveLabel(status: ClearingSaveStatus, isSupabaseLive: boolean) {
  const modeLabel = isSupabaseLive ? "원격" : "로컬";

  switch (status) {
    case "saving":
      return `${modeLabel} 저장 중`;
    case "unsaved":
      return `${modeLabel} 수정됨`;
    case "error":
      return `${modeLabel} 저장 실패`;
    case "saved":
    default:
      return `${modeLabel} 저장됨`;
  }
}

function getLocalClearingStorageKey(roomSlug: string) {
  return `obnofi-clearing-room:${roomSlug}`;
}

function loadLocalClearingSnapshot(roomSlug: string): LocalClearingSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getLocalClearingStorageKey(roomSlug));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LocalClearingSnapshot;
  } catch {
    return null;
  }
}

function saveLocalClearingSnapshot(roomSlug: string, snapshot: LocalClearingSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getLocalClearingStorageKey(roomSlug),
    JSON.stringify(snapshot)
  );
}

export function ClearingBoard({
  embedded = false,
  roomSlug,
  title,
}: {
  embedded?: boolean;
  roomSlug: string;
  title?: string;
}) {
  const { data: session } = useSession();
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStateRef = useRef<DragState>(null);
  const panStateRef = useRef<PanState>(null);
  const drawStateRef = useRef<DrawState>(null);
  const lassoStateRef = useRef<LassoState>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const currentRoomRef = useRef<Room | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const lastCursorSyncRef = useRef(0);
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
  const [activeThreadTarget, setActiveThreadTarget] = useState<{
    elementId: string | null;
    x: number;
    y: number;
  } | null>(null);
  const [connectorCursor, setConnectorCursor] = useState<{ x: number; y: number } | null>(null);
  const previousElementsRef = useRef<Element[]>([]);
  const suppressPersistenceRef = useRef(false);
  const latestCommentsRef = useRef<Comment[]>([]);
  const persistTimerRef = useRef<number | null>(null);
  const pendingUpsertsRef = useRef<Map<string, Element>>(new Map());
  const pendingDeletesRef = useRef<Set<string>>(new Set());

  const {
    viewport,
    tool,
    lineStyle,
    selectedElementId,
    setViewport,
    setTool,
    setSelectedElement,
    resetViewport,
  } = useCanvasStore();
  const {
    elements,
    past,
    future,
    setElements,
    addElement,
    updateElement,
    removeElement,
    upsertElement,
    pushHistory,
    undo,
    redo,
  } = useElementStore();
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const {
    clearSelection,
    selectedIds,
    selectSingle,
    selectionBounds,
    setSelectedIds,
    setSelectionBounds,
    toggleSelectedId,
  } = useSelectionStore();
  const {
    currentUser,
    others,
    setCurrentUser,
    setPresenceUsers,
  } = useUserStore();

  const elementLookup = useMemo(
    () => Object.fromEntries(elements.map((element) => [element.id, element])),
    [elements]
  );
  const renderedElements = useMemo(
    () => [...elements].sort((left, right) => left.zIndex - right.zIndex),
    [elements]
  );
  const selectionFrame = useMemo(() => {
    if (selectedIds.length === 0) {
      return null;
    }
    const selectedElements = elements.filter((element) => selectedIds.includes(element.id));
    if (selectedElements.length === 0) {
      return null;
    }
    const minX = Math.min(...selectedElements.map((element) => element.x));
    const minY = Math.min(...selectedElements.map((element) => element.y));
    const maxX = Math.max(...selectedElements.map((element) => element.x + element.width));
    const maxY = Math.max(...selectedElements.map((element) => element.y + element.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [elements, selectedIds]);

  useEffect(() => {
    const localUser = session?.user
      ? buildSessionUserProfile(session.user)
      : getLocalUser();

    if (typeof window !== "undefined") {
      window.localStorage.setItem("obnofi-clearing-user", JSON.stringify(localUser));
    }

    currentUserRef.current = localUser;
    setCurrentUser(localUser);
  }, [session, setCurrentUser]);

  useEffect(() => {
    latestCommentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let isMounted = true;
    const supabaseEnabled = isSupabaseConfigured();
    setIsSupabaseLive(supabaseEnabled);

    const bootstrap = async () => {
      const localSnapshot = loadLocalClearingSnapshot(roomSlug);
      const fallbackRoom =
        localSnapshot?.room ?? createDemoRoom(currentUser.id);
      const fallbackElements =
        localSnapshot?.elements ??
        createDemoElements(fallbackRoom.id, currentUser.id);
      const fallbackComments =
        localSnapshot?.comments ??
        [createDemoComment(fallbackRoom.id, fallbackElements[0]?.id ?? null, currentUser.id)];

      if (!supabaseEnabled) {
        if (!isMounted) {
          return;
        }
        currentRoomRef.current = fallbackRoom;
        setRoom(fallbackRoom);
        suppressPersistenceRef.current = true;
        setElements(fallbackElements);
        setComments(fallbackComments);
        setPresenceUsers([currentUser]);
        setSaveStatus("saved");
        setIsBootstrapping(false);
        queueMicrotask(() => {
          suppressPersistenceRef.current = false;
        });
        return;
      }

      const supabase = createBrowserSupabaseClient();

      try {
        await supabase.from("users").upsert(
          {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            avatar_url: currentUser.avatarUrl,
            color: currentUser.color,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        let activeRoom: Room;
        const roomResult = await supabase
          .from("rooms")
          .select("*")
          .eq("slug", roomSlug)
          .maybeSingle();

        if (roomResult.data) {
          activeRoom = {
            id: roomResult.data.id,
            name: roomResult.data.name,
            slug: roomResult.data.slug,
            ownerId: roomResult.data.owner_id,
            background: roomResult.data.background,
            createdAt: roomResult.data.created_at,
            updatedAt: roomResult.data.updated_at,
          };
        } else {
          const insertedRoom = await supabase
            .from("rooms")
            .insert({
              name: "Jungle Clearing",
              slug: roomSlug,
              owner_id: currentUser.id,
              background: "paper",
            })
            .select("*")
            .single();

          if (insertedRoom.error || !insertedRoom.data) {
            throw insertedRoom.error;
          }

          activeRoom = {
            id: insertedRoom.data.id,
            name: insertedRoom.data.name,
            slug: insertedRoom.data.slug,
            ownerId: insertedRoom.data.owner_id,
            background: insertedRoom.data.background,
            createdAt: insertedRoom.data.created_at,
            updatedAt: insertedRoom.data.updated_at,
          };
        }

        currentRoomRef.current = activeRoom;

        const elementResult = await supabase
          .from("elements")
          .select("*")
          .eq("room_id", activeRoom.id)
          .order("z_index", { ascending: true });

        let nextElements: Element[];
        if (!elementResult.data || elementResult.data.length === 0) {
          nextElements = createDemoElements(activeRoom.id, currentUser.id);
          await supabase.from("elements").insert(
            nextElements.map((element) => ({
              id: element.id,
              room_id: element.roomId,
              type: element.type,
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              rotation: element.rotation,
              z_index: element.zIndex,
              created_by: element.createdBy,
              style: element.style,
              content: element.content,
              created_at: element.createdAt,
              updated_at: element.updatedAt,
            }))
          );
        } else {
          nextElements = (elementResult.data as Record<string, unknown>[]).map(toElement);
        }

        const commentResult = await supabase
          .from("comments")
          .select("*")
          .eq("room_id", activeRoom.id)
          .order("created_at", { ascending: true });

        let nextComments: Comment[];
        if (!commentResult.data || commentResult.data.length === 0) {
          nextComments = [createDemoComment(activeRoom.id, nextElements[0]?.id ?? null, currentUser.id)];
          await supabase.from("comments").insert(
            nextComments.map((comment) => ({
              id: comment.id,
              room_id: comment.roomId,
              element_id: comment.elementId,
              author_id: comment.authorId,
              body: comment.body,
              content: comment.content ?? comment.body,
              parent_id: comment.parentId ?? null,
              x: comment.x,
              y: comment.y,
              resolved: comment.resolved ?? false,
              created_at: comment.createdAt,
              updated_at: comment.updatedAt,
            }))
          );
        } else {
          nextComments = (commentResult.data as Record<string, unknown>[]).map(toComment);
        }

        if (!isMounted) {
          return;
        }

        setRoom(activeRoom);
        suppressPersistenceRef.current = true;
        setElements(nextElements);
        setComments(nextComments);
        setSaveStatus("saved");
        queueMicrotask(() => {
          suppressPersistenceRef.current = false;
        });

        const channel = supabase
          .channel(`clearing-room:${activeRoom.id}`, {
            config: {
              presence: {
                key: currentUser.id,
              },
            },
          })
          .on("broadcast", { event: "emoji-stamp" }, ({ payload }) => {
            setFloatingStamps((current) => [...current, payload as FloatingEmojiStamp]);
          })
          .on("presence", { event: "sync" }, () => {
            const presenceState = channel.presenceState();
            const nextUsers = Object.values(presenceState)
              .flat()
              .map((presence) => ({
                ...(presence as unknown as User),
                lastSeenAt: new Date().toISOString(),
              }));
            setPresenceUsers([currentUser, ...nextUsers.filter((user) => user.id !== currentUser.id)]);
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "elements",
              filter: `room_id=eq.${activeRoom.id}`,
            },
            (payload) => {
              if (payload.eventType === "DELETE") {
                suppressPersistenceRef.current = true;
                removeElement(payload.old.id as string);
                queueMicrotask(() => {
                  suppressPersistenceRef.current = false;
                });
                return;
              }

              const nextRecord = (payload.new ?? payload.old) as Record<string, unknown>;
              if (!nextRecord.id) {
                return;
              }

              suppressPersistenceRef.current = true;
              upsertElement(toElement(nextRecord));
              queueMicrotask(() => {
                suppressPersistenceRef.current = false;
              });
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "comments",
              filter: `room_id=eq.${activeRoom.id}`,
            },
            (payload) => {
              if (payload.eventType === "DELETE") {
                setComments((current) =>
                  current.filter((comment) => comment.id !== payload.old.id)
                );
                return;
              }

              const nextRecord = payload.new as Record<string, unknown>;
              setComments((current) => {
                const nextComment = toComment(nextRecord);
                const existingIndex = current.findIndex((comment) => comment.id === nextComment.id);
                if (existingIndex === -1) {
                  return [...current, nextComment];
                }
                const next = [...current];
                next[existingIndex] = nextComment;
                return next;
              });
            }
          );

        presenceChannelRef.current = channel;
        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track(currentUser);
          }
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        logClearingPersistenceError("bootstrap failed, switching to local mode", error);
        currentRoomRef.current = fallbackRoom;
        setRoom(fallbackRoom);
        setElements(fallbackElements);
        setComments(fallbackComments);
        setPresenceUsers([currentUser]);
        setIsSupabaseLive(false);
        setSaveStatus("saved");
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
      if (presenceChannelRef.current) {
        void presenceChannelRef.current.unsubscribe();
      }
    };
  }, [currentUser, roomSlug, removeElement, setComments, setCurrentUser, setElements, setPresenceUsers, upsertElement]);

  const persistElement = useCallback(async (element: Element) => {
    if (!isSupabaseLive) {
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.from("elements").upsert(
        {
          ...toElementInsert(element),
        },
        { onConflict: "id" }
      );
    } catch (error) {
      logClearingPersistenceError("persistElement failed", error);
      throw error;
    }
  }, [isSupabaseLive]);

  const removePersistedElement = useCallback(async (elementId: string) => {
    if (!isSupabaseLive) {
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.from("elements").delete().eq("id", elementId);
    } catch (error) {
      logClearingPersistenceError("removePersistedElement failed", error);
      throw error;
    }
  }, [isSupabaseLive]);

  const flushCanvasPersistence = useCallback(async () => {
    persistTimerRef.current = null;

    if (!room || isBootstrapping) {
      return;
    }

    const pendingUpserts = Array.from(pendingUpsertsRef.current.values());
    const pendingDeletes = Array.from(pendingDeletesRef.current.values());

    if (pendingUpserts.length === 0 && pendingDeletes.length === 0) {
      if (!isSupabaseLive) {
        saveLocalClearingSnapshot(roomSlug, {
          room,
          elements,
          comments: latestCommentsRef.current,
        });
        setSaveStatus("saved");
      }
      return;
    }

    setSaveStatus("saving");

    if (!isSupabaseLive) {
      saveLocalClearingSnapshot(roomSlug, {
        room,
        elements,
        comments: latestCommentsRef.current,
      });
      pendingUpsertsRef.current.clear();
      pendingDeletesRef.current.clear();
      setSaveStatus("saved");
      return;
    }

    try {
      await Promise.all([
        ...pendingUpserts.map((element) => persistElement(element)),
        ...pendingDeletes.map((elementId) => removePersistedElement(elementId)),
      ]);
      pendingUpsertsRef.current.clear();
      pendingDeletesRef.current.clear();
      setSaveStatus("saved");
    } catch (error) {
      logClearingPersistenceError("flushCanvasPersistence failed", error);
      setSaveStatus("error");
    }
  }, [elements, isBootstrapping, isSupabaseLive, room, roomSlug, persistElement, removePersistedElement]);

  const scheduleCanvasPersistence = useCallback(() => {
    setSaveStatus("unsaved");
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      void flushCanvasPersistence();
    }, 800);
  }, [flushCanvasPersistence]);

  useEffect(() => {
    if (isBootstrapping) {
      previousElementsRef.current = elements;
      return;
    }

    if (suppressPersistenceRef.current) {
      previousElementsRef.current = elements;
      return;
    }

    const previousById = new Map(
      previousElementsRef.current.map((element) => [element.id, element])
    );
    const nextById = new Map(elements.map((element) => [element.id, element]));

    for (const element of elements) {
      const previous = previousById.get(element.id);
      if (!previous || JSON.stringify(previous) !== JSON.stringify(element)) {
        pendingUpsertsRef.current.set(element.id, element);
        pendingDeletesRef.current.delete(element.id);
      }
    }

    for (const previous of previousElementsRef.current) {
      if (!nextById.has(previous.id)) {
        pendingUpsertsRef.current.delete(previous.id);
        pendingDeletesRef.current.add(previous.id);
      }
    }

    if (
      pendingUpsertsRef.current.size > 0 ||
      pendingDeletesRef.current.size > 0
    ) {
      scheduleCanvasPersistence();
    }

    previousElementsRef.current = elements;
  }, [elements, isBootstrapping, isSupabaseLive, scheduleCanvasPersistence]);

  useEffect(() => {
    if (isBootstrapping || isSupabaseLive || !room) {
      return;
    }
    scheduleCanvasPersistence();
  }, [comments, isBootstrapping, isSupabaseLive, room, scheduleCanvasPersistence]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  const handleCreateElement = async (kind: "sticky" | "connector") => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser) {
      return;
    }

    pushHistory();
    const nextElement = buildElement(kind, activeRoom.id, activeUser.id, elements.length + 1, elements);
    addElement(nextElement);
    selectSingle(nextElement.id);
    setSelectedElement(nextElement.id);
    await persistElement(nextElement);
  };

  const handlePathCreated = async (element: Element) => {
    pushHistory();
    addElement(element);
    selectSingle(element.id);
    setSelectedElement(element.id);
    await persistElement(element);
  };

  const handleCreateComment = async () => {
    setTool("comment");
  };

  const submitComment = async (content: string, parentId?: string | null) => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser || !activeThreadTarget) {
      return;
    }

    const nextComment: Comment = {
      id: crypto.randomUUID(),
      roomId: activeRoom.id,
      elementId: activeThreadTarget.elementId,
      authorId: activeUser.id,
      body: content,
      content,
      parentId: parentId ?? null,
      x: activeThreadTarget.elementId ? undefined : activeThreadTarget.x,
      y: activeThreadTarget.elementId ? undefined : activeThreadTarget.y,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolved: false,
    };

    setComments((current) => [...current, nextComment]);

    if (!isSupabaseLive) {
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.from("comments").insert({
        id: nextComment.id,
        room_id: nextComment.roomId,
        element_id: nextComment.elementId,
        author_id: nextComment.authorId,
        body: nextComment.body,
        content: nextComment.content,
        parent_id: nextComment.parentId,
        x: nextComment.x,
        y: nextComment.y,
        resolved: false,
        created_at: nextComment.createdAt,
        updated_at: nextComment.updatedAt,
      });
    } catch (error) {
      logClearingPersistenceError("submitComment failed", error);
    }
  };

  const resolveThread = async () => {
    if (!activeThreadTarget) {
      return;
    }

    const targetComments = comments.filter((comment) => {
      if (comment.elementId !== activeThreadTarget.elementId) {
        return false;
      }
      if (comment.elementId) {
        return true;
      }
      return comment.x === activeThreadTarget.x && comment.y === activeThreadTarget.y;
    });

    const ids = targetComments.map((comment) => comment.id);
    setComments((current) =>
      current.map((comment) =>
        ids.includes(comment.id)
          ? { ...comment, resolved: true, resolvedAt: new Date().toISOString() }
          : comment
      )
    );

    if (!isSupabaseLive || ids.length === 0) {
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase
        .from("comments")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .in("id", ids);
    } catch (error) {
      logClearingPersistenceError("resolveThread failed", error);
    }
  };

  const handleImageUpload = async (file: File) => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser) {
      return;
    }

    setUploadingImage(true);

    try {
      let assetUrl = URL.createObjectURL(file);
      if (isSupabaseLive) {
        try {
          assetUrl = await uploadImageToBoard(file, activeRoom.id);
        } catch (error) {
          logClearingPersistenceError("uploadImageToBoard failed", error);
        }
      }
      const nextElement = await createImageElement({
        alt: file.name,
        createdBy: activeUser.id,
        file,
        roomId: activeRoom.id,
        url: assetUrl,
        x: 980,
        y: 440,
        zIndex: elements.length + 1,
      });

      pushHistory();
      addElement(nextElement);
      selectSingle(nextElement.id);
      setSelectedElement(nextElement.id);
      await persistElement(nextElement);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEmbedCreate = async (url: string) => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser) {
      return;
    }

    const nextElement = createEmbedElement({
      createdBy: activeUser.id,
      roomId: activeRoom.id,
      url,
      x: 960,
      y: 420,
      zIndex: elements.length + 1,
    });

    if (!nextElement) {
      return;
    }

    pushHistory();
    addElement(nextElement);
    selectSingle(nextElement.id);
    setSelectedElement(nextElement.id);
    await persistElement(nextElement);
    setEmbedDraftUrl(null);
  };

  const handleElementPointerDown = (event: React.PointerEvent<HTMLDivElement>, elementId: string) => {
    if (!boardRef.current) {
      return;
    }

    const element = elementLookup[elementId];
    if (!element) {
      return;
    }

    // Check if a connector is selected and we're clicking on another element to connect
    // Only works when in select tool mode
    const selectedConnector = selectedElementId ? elementLookup[selectedElementId] : null;
    if (tool === "select" && selectedConnector?.type === "connector" && elementId !== selectedElementId) {
      event.stopPropagation();
      // Connect the selected connector to this element
      const connector = selectedConnector;
      // Determine if we're connecting the start or end point
      // If fromElementId is not set, connect start. If toElementId is not set, connect end.
      // Otherwise, default to connecting the end point.
      const updates: Partial<Element> = {};

      if (!connector.content.fromElementId) {
        // Connect start point to this element
        updates.content = {
          ...connector.content,
          fromElementId: elementId,
        };
      } else {
        // Connect end point to this element
        updates.content = {
          ...connector.content,
          toElementId: elementId,
        };
      }

      updateElement(connector.id, updates);
      persistElement({ ...connector, ...updates } as Element);
      return;
    }

    if (tool === "comment") {
      event.stopPropagation();
      setActiveThreadTarget({
        elementId,
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }

    // Don't stop propagation - let board handle pointer move/up for dragging
    // event.stopPropagation();

    const rect = boardRef.current.getBoundingClientRect();
    const scenePoint = getScenePoint(
      event.clientX,
      event.clientY,
      rect,
      viewport.x,
      viewport.y,
      viewport.zoom
    );
    const dragTargets =
      selectedIds.includes(elementId) && selectedIds.length > 0
        ? elements.filter((item) => selectedIds.includes(item.id))
        : [element];

    if (event.shiftKey) {
      toggleSelectedId(elementId);
    } else {
      selectSingle(elementId);
      setSelectedElement(elementId);
    }

    // If dragging a section, also store the original positions of elements inside it
    const sectionChildOrigins: Record<string, { x: number; y: number }> = {};
    const movingSectionIds = dragTargets.filter((target) => target.type === "section").map((target) => target.id);

    if (movingSectionIds.length > 0) {
      elements.forEach((candidate) => {
        if (candidate.type === "section" || dragTargets.some((t) => t.id === candidate.id)) {
          return;
        }
        // Check if element is inside any of the moving sections
        for (const sectionId of movingSectionIds) {
          const section = elementLookup[sectionId];
          if (!section) continue;

          const centerX = candidate.x + candidate.width / 2;
          const centerY = candidate.y + candidate.height / 2;
          if (
            centerX >= section.x &&
            centerX <= section.x + section.width &&
            centerY >= section.y &&
            centerY <= section.y + section.height
          ) {
            sectionChildOrigins[candidate.id] = { x: candidate.x, y: candidate.y };
            break;
          }
        }
      });
    }

    dragStateRef.current = {
      elementId,
      pointerId: event.pointerId,
      offsetX: scenePoint.x - element.x,
      offsetY: scenePoint.y - element.y,
      groupOrigin: Object.fromEntries(
        dragTargets.map((item) => [item.id, { x: item.x, y: item.y }])
      ),
      sectionChildOrigins: Object.keys(sectionChildOrigins).length > 0 ? sectionChildOrigins : undefined,
      preDragSnapshot: [...elements],
    };
  };

  const handleBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!boardRef.current) {
      return;
    }

    setContextMenu(null);

    // If click originated from a child element, let the element handler manage selection/drag
    if (event.target !== event.currentTarget) {
      return;
    }

    if (!event.shiftKey) {
      clearSelection();
      setSelectedElement(null);
    }

    const rect = boardRef.current.getBoundingClientRect();
    const scenePoint = getScenePoint(
      event.clientX,
      event.clientY,
      rect,
      viewport.x,
      viewport.y,
      viewport.zoom
    );

    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;

    if (tool === "connector" && activeRoom && activeUser) {
      pushHistory();
      const hasArrow = lineStyle === "arrow";
      const nextElement: Element = {
        id: crypto.randomUUID(),
        roomId: activeRoom.id,
        type: "connector",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        zIndex: elements.length + 1,
        createdBy: activeUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        style: {
          color: "#2E7D45",
          strokeWidth: 2,
          opacity: 1,
        },
        content: {
          kind: "connector",
          start: scenePoint,
          end: scenePoint,
          arrowStart: false,
          arrowEnd: hasArrow,
          lineStyle: lineStyle === "arrow" ? "solid" : lineStyle,
        },
      };

      addElement(nextElement);
      selectSingle(nextElement.id);
      setSelectedElement(nextElement.id);
      drawStateRef.current = {
        elementId: nextElement.id,
        startX: scenePoint.x,
        startY: scenePoint.y,
      };
      return;
    }

    if ((tool === "shape-rectangle" || tool === "shape-ellipse" || tool === "shape-diamond" || tool === "shape-triangle") && activeRoom && activeUser) {
      pushHistory();
      const shapeName =
        tool === "shape-ellipse"
          ? "ellipse"
          : tool === "shape-diamond"
            ? "diamond"
            : tool === "shape-triangle"
              ? "triangle"
              : "rectangle";

      const nextElement: Element = {
        id: crypto.randomUUID(),
        roomId: activeRoom.id,
        type: "shape",
        x: scenePoint.x,
        y: scenePoint.y,
        width: 1,
        height: 1,
        rotation: 0,
        zIndex: elements.length + 1,
        createdBy: activeUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        style: {
          color: "#2E7D45",
          strokeWidth: 2,
          opacity: 1,
        },
        content: {
          kind: "shape",
          shape: shapeName,
          fill: "#F7F7F5",
          label: "",
        },
      };

      addElement(nextElement);
      selectSingle(nextElement.id);
      setSelectedElement(nextElement.id);
      drawStateRef.current = {
        elementId: nextElement.id,
        startX: scenePoint.x,
        startY: scenePoint.y,
      };
      return;
    }

    if (tool === "text" && activeRoom && activeUser) {
      pushHistory();
      const nextElement: Element = {
        id: crypto.randomUUID(),
        roomId: activeRoom.id,
        type: "text",
        x: scenePoint.x,
        y: scenePoint.y,
        width: 220,
        height: 48,
        rotation: 0,
        zIndex: elements.length + 1,
        createdBy: activeUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        style: {
          color: "#37352F",
          opacity: 1,
        },
        content: {
          kind: "text",
          text: "",
          fontSize: 28,
          align: "left",
          weight: 600,
        },
      };
      addElement(nextElement);
      selectSingle(nextElement.id);
      setSelectedElement(nextElement.id);
      void persistElement(nextElement);
      setTool("select");
      return;
    }

    if (tool === "comment") {
      setActiveThreadTarget({
        elementId: null,
        x: scenePoint.x,
        y: scenePoint.y,
      });
      return;
    }

    if (tool === "pen" || tool === "marker") {
      return;
    }

    if (activeEmojiStamp) {
      const stamp: FloatingEmojiStamp = {
        id: crypto.randomUUID(),
        emoji: activeEmojiStamp,
        x: scenePoint.x,
        y: scenePoint.y,
        createdAt: Date.now(),
        userName: currentUserRef.current?.name,
      };
      setFloatingStamps((current) => [...current, stamp]);
      if (presenceChannelRef.current) {
        void presenceChannelRef.current.send({
          type: "broadcast",
          event: "emoji-stamp",
          payload: stamp,
        });
      }
      setActiveEmojiStamp(null);
      return;
    }

    if (tool === "section" && activeRoom && activeUser) {
      pushHistory();
      const nextSection: Element = {
        id: crypto.randomUUID(),
        roomId: activeRoom.id,
        type: "section",
        x: scenePoint.x,
        y: scenePoint.y,
        width: 1,
        height: 1,
        rotation: 0,
        zIndex: -1000,
        createdBy: activeUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        style: {
          color: "#2E7D45",
          opacity: 1,
        },
        content: {
          kind: "section",
          title: "Section",
          background: "rgba(46,125,69,0.08)",
        },
      };
      addElement(nextSection);
      selectSingle(nextSection.id);
      setSelectedElement(nextSection.id);
      drawStateRef.current = {
        elementId: nextSection.id,
        startX: scenePoint.x,
        startY: scenePoint.y,
      };
      return;
    }

    lassoStateRef.current = {
      startX: scenePoint.x,
      startY: scenePoint.y,
      currentX: scenePoint.x,
      currentY: scenePoint.y,
    };
    setSelectionBounds({ x: scenePoint.x, y: scenePoint.y, width: 0, height: 0 });

    panStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
  };

  const handleBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!boardRef.current) {
      return;
    }

    if (tool === "connector") {
      setConnectorCursor({ x: event.clientX, y: event.clientY });
    } else if (connectorCursor) {
      setConnectorCursor(null);
    }

    const boardRect = boardRef.current.getBoundingClientRect();
    const scenePoint = getScenePoint(
      event.clientX,
      event.clientY,
      boardRect,
      viewport.x,
      viewport.y,
      viewport.zoom
    );

    if (dragStateRef.current) {
      const activeDrag = dragStateRef.current;
      const target = elementLookup[activeDrag.elementId];
      if (!target) {
        return;
      }

      const deltaX = scenePoint.x - activeDrag.offsetX - target.x;
      const deltaY = scenePoint.y - activeDrag.offsetY - target.y;
      const movingIds = Object.keys(activeDrag.groupOrigin);
      movingIds.forEach((id) => {
        const origin = activeDrag.groupOrigin[id];
        const candidate = elementLookup[id];
        if (!origin || !candidate) {
          return;
        }
        updateElement(id, {
          x: origin.x + deltaX,
          y: origin.y + deltaY,
          updatedAt: new Date().toISOString(),
        });
      });

      // Move elements inside the dragged sections using pre-calculated origins
      if (activeDrag.sectionChildOrigins) {
        Object.entries(activeDrag.sectionChildOrigins).forEach(([childId, origin]) => {
          updateElement(childId, {
            x: origin.x + deltaX,
            y: origin.y + deltaY,
            updatedAt: new Date().toISOString(),
          });
        });
      }
    }

    if (drawStateRef.current) {
      const draftElement = elementLookup[drawStateRef.current.elementId];
      if (draftElement?.type === "connector") {
        const start = {
          x: drawStateRef.current.startX,
          y: drawStateRef.current.startY,
        };

        updateElement(draftElement.id, {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          content: {
            ...draftElement.content,
            start,
            end: scenePoint,
          },
          updatedAt: new Date().toISOString(),
        });
      } else if (draftElement?.type === "shape" || draftElement?.type === "section") {
        const nextX = Math.min(drawStateRef.current.startX, scenePoint.x);
        const nextY = Math.min(drawStateRef.current.startY, scenePoint.y);
        const nextWidth = Math.max(12, Math.abs(scenePoint.x - drawStateRef.current.startX));
        const nextHeight = Math.max(12, Math.abs(scenePoint.y - drawStateRef.current.startY));

        updateElement(draftElement.id, {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (lassoStateRef.current) {
      const nextBounds = {
        x: Math.min(lassoStateRef.current.startX, scenePoint.x),
        y: Math.min(lassoStateRef.current.startY, scenePoint.y),
        width: Math.abs(scenePoint.x - lassoStateRef.current.startX),
        height: Math.abs(scenePoint.y - lassoStateRef.current.startY),
      };
      lassoStateRef.current = {
        ...lassoStateRef.current,
        currentX: scenePoint.x,
        currentY: scenePoint.y,
      };
      setSelectionBounds(nextBounds);
    }

    if (panStateRef.current) {
      const activePan = panStateRef.current;
      setViewport({
        x: activePan.originX + (event.clientX - activePan.startX),
        y: activePan.originY + (event.clientY - activePan.startY),
      });
    }

    if (presenceChannelRef.current && currentUserRef.current && boardRef.current) {
      const now = Date.now();
      if (now - lastCursorSyncRef.current < 80) {
        return;
      }
      lastCursorSyncRef.current = now;

      const rect = boardRef.current.getBoundingClientRect();
      const scenePoint = getScenePoint(
        event.clientX,
        event.clientY,
        rect,
        viewport.x,
        viewport.y,
        viewport.zoom
      );
      const nextUser = {
        ...currentUserRef.current,
        cursor: scenePoint,
        lastSeenAt: new Date().toISOString(),
      };
      currentUserRef.current = nextUser;
      setCurrentUser(nextUser);
      void presenceChannelRef.current.track(nextUser);
    }
  };

  const handleBoardPointerUp = async () => {
    if (dragStateRef.current) {
      const didMove = Object.entries(dragStateRef.current.groupOrigin).some(([id, origin]) => {
        const el = elementLookup[id];
        return el && (Math.abs(el.x - origin.x) > 1 || Math.abs(el.y - origin.y) > 1);
      });
      if (didMove) {
        pushHistory(dragStateRef.current.preDragSnapshot);
      }
      await Promise.all(
        Object.keys(dragStateRef.current.groupOrigin).map(async (id) => {
          const movedElement = elementLookup[id];
          if (movedElement) {
            await persistElement(movedElement);
          }
        })
      );
    }

    if (drawStateRef.current) {
      const drawnElement = elementLookup[drawStateRef.current.elementId];
      if (drawnElement) {
        await persistElement(drawnElement);
      }
      const wasConnectorDraw = drawnElement?.type === "connector";
      drawStateRef.current = null;
      setTool(wasConnectorDraw ? "connector" : "select");
    }

    if (lassoStateRef.current && selectionBounds) {
      const insideIds = elements
        .filter((element) => {
          const minX = selectionBounds.x;
          const minY = selectionBounds.y;
          const maxX = selectionBounds.x + selectionBounds.width;
          const maxY = selectionBounds.y + selectionBounds.height;
          return (
            element.x >= minX &&
            element.y >= minY &&
            element.x + element.width <= maxX &&
            element.y + element.height <= maxY
          );
        })
        .map((element) => element.id);
      setSelectedIds(insideIds);
      setSelectedElement(insideIds[0] ?? null);
      setSelectionBounds(null);
      lassoStateRef.current = null;
    }

    dragStateRef.current = null;
    panStateRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!boardRef.current || !event.metaKey) {
      return;
    }

    event.preventDefault();
    const nextZoom = clampZoom(viewport.zoom - event.deltaY * 0.0012);
    setViewport({ zoom: nextZoom });
  };

  useEffect(() => {
    const handleDelete = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      if (
        active?.getAttribute("contenteditable") === "true" ||
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (selectedIds.length === 0) {
        return;
      }
      pushHistory();
      selectedIds.forEach((id) => removeElement(id));
      clearSelection();
      setSelectedElement(null);
    };

    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [clearSelection, pushHistory, removeElement, selectedIds, setSelectedElement]);

  useEffect(() => {
    const handleUndoRedo = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest("input, textarea, [contenteditable='true']")) return;

      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.key === "z" && event.shiftKey) || event.key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleUndoRedo);
    return () => window.removeEventListener("keydown", handleUndoRedo);
  }, [undo, redo]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) {
        return;
      }

      const text = event.clipboardData?.getData("text/plain")?.trim();
      if (!text) {
        return;
      }

      try {
        new URL(text);
      } catch {
        return;
      }

      event.preventDefault();
      setEmbedDraftUrl(text);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFloatingStamps((current) => {
        if (current.length === 0) {
          return current;
        }

        const now = Date.now();
        const next = current.filter((stamp) => now - stamp.createdAt < 3000);
        return next.length === current.length ? current : next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  const handleVote = (elementId: string) => {
    const activeUser = currentUserRef.current;
    const target = elementLookup[elementId];
    if (!activeUser || !target || (target.type !== "sticky" && target.type !== "shape")) {
      return;
    }

    const currentVotes = target.content.votes ?? {};
    const nextVotes = Math.min(3, (currentVotes[activeUser.id] ?? 0) + 1);

    if (target.type === "sticky") {
      updateElement(elementId, {
        content: {
          ...target.content,
          votes: {
            ...currentVotes,
            [activeUser.id]: nextVotes,
          },
        },
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    updateElement(elementId, {
      content: {
        ...target.content,
        votes: {
          ...currentVotes,
          [activeUser.id]: nextVotes,
        },
      },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className={`flex flex-col bg-[var(--color-background)] text-[var(--color-text-primary)] ${
        embedded ? "h-full" : "min-h-screen"
      }`}
    >
      {!embedded ? (
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              Clearing
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{title ?? room?.name ?? "Jungle Clearing"}</h1>
              <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                {isSupabaseLive ? "Supabase live" : "Local mode"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span>{elements.length} elements</span>
            <span>{comments.length} comments</span>
            <span>{others.length + (currentUser ? 1 : 0)} gardeners</span>
          </div>
        </div>
        </header>
      ) : null}

      <div
        className={`flex flex-1 gap-4 ${
          embedded ? "h-full p-0" : "mx-auto w-full max-w-[1600px] px-4 py-4"
        }`}
      >
        <main
          className={`relative flex-1 overflow-hidden border border-[var(--color-border)] bg-[var(--color-board-surface)] ${
            embedded
              ? "h-full rounded-[20px]"
              : "rounded-[24px] shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
          }`}
        >
          <div className="absolute right-4 top-4 z-30 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-1 text-[11px] text-[var(--color-text-secondary)] backdrop-blur">
            {getClearingSaveLabel(saveStatus, isSupabaseLive)}
          </div>

          <div className="absolute bottom-4 left-4 z-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 text-sm backdrop-blur">
            <p className="font-medium text-[var(--color-text-primary)]">Presence</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {currentUser && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
                  <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent)] text-[9px] font-semibold text-white">
                    {currentUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={currentUser.name}
                        className="h-full w-full object-cover"
                        src={currentUser.avatarUrl}
                      />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  {currentUser.name}
                </span>
              )}
              {others.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface)] text-[9px] font-semibold text-[var(--color-text-primary)]">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={user.name}
                        className="h-full w-full object-cover"
                        src={user.avatarUrl}
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  {user.name}
                </span>
              ))}
            </div>
          </div>

          <div
            ref={boardRef}
            className="absolute inset-0 overflow-hidden"
            onDragOver={(event) => {
              if (isImageDrop(event.dataTransfer)) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => {
              if (!boardRef.current || !isImageDrop(event.dataTransfer)) {
                return;
              }
              event.preventDefault();
              const file = Array.from(event.dataTransfer.files).find((item) =>
                item.type.startsWith("image/")
              );
              if (!file) {
                return;
              }
              void handleImageUpload(file);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              if (selectedIds.length === 0) {
                return;
              }
              setContextMenu({ x: event.clientX, y: event.clientY });
            }}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={handleBoardPointerUp}
            onPointerLeave={handleBoardPointerUp}
            onWheel={handleWheel}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: "var(--color-board-surface)",
                backgroundImage:
                  "linear-gradient(to right, var(--color-board-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--color-board-grid) 1px, transparent 1px)",
                backgroundSize: `${32 * viewport.zoom}px ${32 * viewport.zoom}px`,
                backgroundPosition: `${viewport.x}px ${viewport.y}px`,
              }}
            />

            {/* PenTool layer - only active when pen/marker selected */}
            {(tool === "pen" || tool === "marker") && (
              <div className="absolute inset-0 z-20 pointer-events-auto">
                <PenTool
                  activeTool={tool}
                  boardRef={boardRef}
                  color={drawingColor}
                  currentUserId={currentUserRef.current?.id ?? null}
                  roomId={currentRoomRef.current?.id ?? null}
                  strokeWidth={tool === "marker" ? Math.max(drawingStrokeWidth, 16) : drawingStrokeWidth}
                  viewport={viewport}
                  zIndex={elements.length + 1}
                  onPathCreated={handlePathCreated}
                />
              </div>
            )}

            <div
              className="pointer-events-none relative"
              style={{
                width: BOARD_WIDTH,
                height: BOARD_HEIGHT,
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: "top left",
              }}
            >
              {renderedElements.map((element) => {
                // Find if this element is inside any section
                const containingSection = elements.find((e) =>
                  e.type === "section" &&
                  e.id !== element.id &&
                  element.x >= e.x &&
                  element.x + element.width <= e.x + e.width &&
                  element.y >= e.y &&
                  element.y + element.height <= e.y + e.height
                );

                return (
                  <BoardElementRenderer
                    key={element.id}
                    commentCount={comments.filter((comment) => comment.elementId === element.id).length}
                    containingSectionId={containingSection?.id}
                    element={element}
                    isSectionSelected={containingSection ? selectedIds.includes(containingSection.id) : false}
                    isSelected={selectedIds.includes(element.id)}
                    linkedElements={elementLookup}
                    onPointerDown={handleElementPointerDown}
                    onVote={handleVote}
                    scale={viewport.scale}
                  />
                );
              })}

              <SelectionBox bounds={selectionFrame} scale={viewport.scale} />

              {comments
                .filter((comment) => !comment.elementId && typeof comment.x === "number" && typeof comment.y === "number")
                .map((comment) => (
                  <div
                    key={comment.id}
                    className={`pointer-events-auto absolute flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] px-3 text-xs font-medium shadow-sm ${
                      comment.resolved ? "bg-zinc-200 text-zinc-500" : "bg-[var(--color-surface)]"
                    }`}
                    style={{ left: comment.x, top: comment.y }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveThreadTarget({
                        elementId: null,
                        x: comment.x ?? 0,
                        y: comment.y ?? 0,
                      });
                    }}
                  >
                    💬
                  </div>
                ))}

              {floatingStamps.map((stamp) => (
                <EmojiStamp key={stamp.id} stamp={stamp} />
              ))}

              {others
                .filter((user) => user.cursor)
                .map((user) => (
                  <div
                    key={user.id}
                    className="pointer-events-none absolute z-30"
                    style={{
                      left: user.cursor?.x ?? 0,
                      top: user.cursor?.y ?? 0,
                    }}
                  >
                    <div
                      className="h-4 w-4 rotate-[-18deg] rounded-[4px]"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    />
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)]/95 px-2 py-1 shadow-sm ring-1 ring-[var(--color-border)] backdrop-blur">
                      <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent-subtle)] text-[10px] font-semibold text-[var(--color-accent)]">
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={user.name}
                            className="h-full w-full object-cover"
                            src={user.avatarUrl}
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--color-text-primary)]">
                        {user.name}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
              <ClearingToolbar
                activeTool={tool}
                canRedo={canRedo}
                canUndo={canUndo}
                compact={embedded}
                isUploadingImage={uploadingImage}
                lineStyle={lineStyle}
                onAddComment={handleCreateComment}
                onAddElement={handleCreateElement}
                onDrawingColorChange={setDrawingColor}
                onEmojiStampSelect={setActiveEmojiStamp}
                onLineStyleChange={useCanvasStore.getState().setLineStyle}
                onOpenImagePicker={() => fileInputRef.current?.click()}
                onRedo={redo}
                onResetViewport={resetViewport}
                onSetTool={setTool}
                onStrokeWidthChange={setDrawingStrokeWidth}
                onUndo={undo}
                strokeColor={drawingColor}
                strokeWidth={drawingStrokeWidth}
              />
            </div>

            {tool === "connector" && connectorCursor ? (
              <div
                className="pointer-events-none fixed z-[1000] flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-2 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] shadow-sm backdrop-blur"
                style={{
                  left: connectorCursor.x + 14,
                  top: connectorCursor.y + 12,
                }}
              >
                <Waypoints className="h-3 w-3 opacity-55" />
                <span className="opacity-60">draw link</span>
              </div>
            ) : null}
          </div>
        </main>

        {!embedded ? <PropertiesPanel /> : null}
      </div>

      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onBringForward={() => {
            selectedIds.forEach((id) => {
              const target = elementLookup[id];
              if (!target) {
                return;
              }
              updateElement(id, { zIndex: target.zIndex + 1 });
            });
            setContextMenu(null);
          }}
          onDelete={() => {
            pushHistory();
            selectedIds.forEach((id) => removeElement(id));
            clearSelection();
            setContextMenu(null);
          }}
          onSendBackward={() => {
            selectedIds.forEach((id) => {
              const target = elementLookup[id];
              if (!target) {
                return;
              }
              updateElement(id, {
                zIndex: target.type === "section" ? -1000 : target.zIndex - 1,
              });
            });
            setContextMenu(null);
          }}
        />
      ) : null}

      {activeThreadTarget ? (
        <CommentThread
          comments={comments.filter((comment) => {
            if (comment.elementId !== activeThreadTarget.elementId) {
              return false;
            }
            if (comment.elementId) {
              return true;
            }
            return comment.x === activeThreadTarget.x && comment.y === activeThreadTarget.y;
          })}
          x={activeThreadTarget.elementId ? activeThreadTarget.x : activeThreadTarget.x + viewport.x}
          y={activeThreadTarget.elementId ? activeThreadTarget.y : activeThreadTarget.y + viewport.y}
          onClose={() => {
            setActiveThreadTarget(null);
            setTool("select");
          }}
          onReply={(content, parentId) => void submitComment(content, parentId)}
          onResolve={() => void resolveThread()}
        />
      ) : null}

      {embedDraftUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">Create embed</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              YouTube, Figma, and Google Maps render as embeds. Other URLs become link cards.
            </p>
            <input
              autoFocus
              className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm outline-none"
              value={embedDraftUrl}
              onChange={(event) => setEmbedDraftUrl(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm"
                type="button"
                onClick={() => setEmbedDraftUrl(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
                type="button"
                onClick={() => void handleEmbedCreate(embedDraftUrl)}
              >
                Place embed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImageUpload(file);
          }
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
