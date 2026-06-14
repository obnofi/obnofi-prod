import { useCallback, useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Comment, Element, Room, User } from "@obnofi/types/clearing";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  createDemoComment,
  createDemoElements,
  createDemoRoom,
} from "@/lib/whiteboard";
import { useElementStore } from "@/store/useElementStore";
import { useUserStore } from "@/store/useUserStore";
import {
  clearingBootstrapCache,
  clearingBootstrapRequests,
} from "@/lib/canvas/clearingBoardConstants";
import type { ClearingBootstrapState, ClearingElementBroadcast } from "@/lib/canvas/clearingBoardTypes";
import {
  buildBootstrapState,
} from "@/lib/canvas/clearingBoardSupabase";
import {
  getClearingBootstrapKey,
  loadLocalClearingSnapshot,
  logClearingPersistenceError,
  toComment,
  toElement,
} from "@/lib/canvas/clearingBoardUtils";
import type { FloatingEmojiStamp } from "@/components/elements/EmojiStamp";

export type ClearingBootstrapOptions = {
  roomSlug: string;
  embedded: boolean;
  realtimeEnabled: boolean;
  currentUserId: string | null;
  currentUserRef: React.MutableRefObject<User | null>;
  currentRoomRef: React.MutableRefObject<Room | null>;
  presenceChannelRef: React.MutableRefObject<RealtimeChannel | null>;
  presenceChannelReadyRef: React.MutableRefObject<boolean>;
  clearingOriginIdRef: React.MutableRefObject<string>;
  suppressPersistenceRef: React.MutableRefObject<boolean>;
  pendingUpsertsRef: React.MutableRefObject<Map<string, Element>>;
  pendingDeletesRef: React.MutableRefObject<Set<string>>;
  skipRemoteUpsertsRef: React.MutableRefObject<Map<string, string>>;
  skipRemoteDeletesRef: React.MutableRefObject<Set<string>>;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  setIsBootstrapping: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSupabaseLive: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveStatus: React.Dispatch<React.SetStateAction<"saved" | "saving" | "unsaved" | "error">>;
  setFloatingStamps: React.Dispatch<React.SetStateAction<FloatingEmojiStamp[]>>;
  clearSelection: () => void;
  resetViewport: () => void;
  setSelectedElement: (id: string | null) => void;
};

export function useClearingBootstrap({
  roomSlug,
  embedded,
  realtimeEnabled,
  currentUserId,
  currentUserRef,
  currentRoomRef,
  presenceChannelRef,
  presenceChannelReadyRef,
  clearingOriginIdRef,
  suppressPersistenceRef,
  pendingUpsertsRef,
  pendingDeletesRef,
  skipRemoteUpsertsRef,
  skipRemoteDeletesRef,
  setRoom,
  setComments,
  setIsBootstrapping,
  setIsSupabaseLive,
  setSaveStatus,
  setFloatingStamps,
  clearSelection,
  resetViewport,
  setSelectedElement,
}: ClearingBootstrapOptions) {
  const { setElements, upsertElement, removeElement } = useElementStore();
  const { setPresenceUsers } = useUserStore();

  const applyRemoteElementUpsert = useCallback(
    (element: Element) => {
      const existing = useElementStore.getState().elements.find((c) => c.id === element.id);
      const serialized = JSON.stringify(element);
      if (existing) {
        const skippedSerialized = skipRemoteUpsertsRef.current.get(element.id);
        if ((skippedSerialized ?? JSON.stringify(existing)) === serialized) return;
      }
      skipRemoteUpsertsRef.current.set(element.id, serialized);
      upsertElement(element);
    },
    [upsertElement, skipRemoteUpsertsRef]
  );

  const applyRemoteElementDelete = useCallback(
    (elementId: string) => {
      skipRemoteDeletesRef.current.add(elementId);
      removeElement(elementId);
    },
    [removeElement, skipRemoteDeletesRef]
  );

  useEffect(() => {
    const activeUser = currentUserRef.current;
    if (!activeUser || activeUser.id !== currentUserId) return;

    let isMounted = true;
    currentRoomRef.current = null;
    presenceChannelReadyRef.current = false;
    suppressPersistenceRef.current = true;
    pendingUpsertsRef.current.clear();
    pendingDeletesRef.current.clear();
    skipRemoteUpsertsRef.current.clear();
    skipRemoteDeletesRef.current.clear();
    setIsBootstrapping(true);
    setRoom(null);
    setComments([]);
    setElements([]);
    clearSelection();
    setSelectedElement(null);
    resetViewport();

    const supabaseEnabled = isSupabaseConfigured();
    setIsSupabaseLive(supabaseEnabled);

    const cacheKey = getClearingBootstrapKey(roomSlug, activeUser.id);

    const applyState = (state: ClearingBootstrapState) => {
      currentRoomRef.current = state.room;
      setRoom(state.room);
      suppressPersistenceRef.current = true;
      setElements(state.elements);
      setComments(state.comments);
      setIsSupabaseLive(state.isSupabaseLive);
      setSaveStatus("saved");
      queueMicrotask(() => { suppressPersistenceRef.current = false; });
    };

    const buildFallback = (): ClearingBootstrapState => {
      const localSnapshot = loadLocalClearingSnapshot(roomSlug);
      const room = localSnapshot?.room ?? createDemoRoom(activeUser.id, roomSlug);
      const elements = localSnapshot?.elements ?? createDemoElements(room.id, activeUser.id);
      const comments = localSnapshot?.comments ?? [createDemoComment(room.id, elements[0]?.id ?? null, activeUser.id)];
      return { room, elements, comments, isSupabaseLive: false };
    };

    const subscribeToChannel = (state: ClearingBootstrapState) => {
      if (!realtimeEnabled) {
        setPresenceUsers([activeUser]);
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { room: activeRoom } = state;

      const channel = supabase
        .channel(`clearing-room:${activeRoom.id}`, {
          config: {
            broadcast: { self: false, ack: true },
            presence: { key: activeUser.id, enabled: true },
          },
        })
        .on("broadcast", { event: "element-mutation" }, ({ payload }) => {
          const mutation = payload as ClearingElementBroadcast;
          if (!mutation || mutation.originId === clearingOriginIdRef.current) return;
          if (mutation.kind === "delete") { applyRemoteElementDelete(mutation.elementId); return; }
          applyRemoteElementUpsert(mutation.element);
        })
        .on("broadcast", { event: "emoji-stamp" }, ({ payload }) => {
          setFloatingStamps((current) => [...current, payload as FloatingEmojiStamp]);
        })
        .on("presence", { event: "sync" }, () => {
          const nextUsers = Object.values(channel.presenceState())
            .flat()
            .map((p) => ({ ...(p as unknown as User), lastSeenAt: new Date().toISOString() }));
          setPresenceUsers([activeUser, ...nextUsers.filter((u) => u.id !== activeUser.id)]);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "elements", filter: `room_id=eq.${activeRoom.id}` }, (payload) => {
          if (payload.eventType === "DELETE") { applyRemoteElementDelete(payload.old.id as string); return; }
          const rec = (payload.new ?? payload.old) as Record<string, unknown>;
          if (rec.id) applyRemoteElementUpsert(toElement(rec));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `room_id=eq.${activeRoom.id}` }, (payload) => {
          if (payload.eventType === "DELETE") {
            setComments((current) => current.filter((c) => c.id !== payload.old.id));
            return;
          }
          const rec = payload.new as Record<string, unknown>;
          setComments((current) => {
            const next = toComment(rec);
            const idx = current.findIndex((c) => c.id === next.id);
            if (idx === -1) return [...current, next];
            const arr = [...current];
            arr[idx] = next;
            return arr;
          });
        });

      presenceChannelRef.current = channel;
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") { presenceChannelReadyRef.current = true; await channel.track(activeUser); return; }
        presenceChannelReadyRef.current = false;
      });
    };

    const bootstrap = async () => {
      const localFallback = buildFallback();

      const cached = clearingBootstrapCache.get(cacheKey);
      if (embedded && cached) {
        if (!isMounted) return;
        applyState(cached);
        setPresenceUsers([activeUser]);
        setIsBootstrapping(false);
        return;
      }

      if (!supabaseEnabled) {
        if (!isMounted) return;
        clearingBootstrapCache.set(cacheKey, localFallback);
        applyState(localFallback);
        setPresenceUsers([activeUser]);
        setIsBootstrapping(false);
        return;
      }

      try {
        let request = clearingBootstrapRequests.get(cacheKey);
        if (!request) {
          request = buildBootstrapState(roomSlug, activeUser).finally(() => {
            clearingBootstrapRequests.delete(cacheKey);
          });
          clearingBootstrapRequests.set(cacheKey, request);
        }

        const bootstrapState = await request;
        if (!isMounted) return;

        clearingBootstrapCache.set(cacheKey, bootstrapState);
        applyState(bootstrapState);
        subscribeToChannel(bootstrapState);
      } catch (error) {
        if (!isMounted) return;
        logClearingPersistenceError("bootstrap failed, switching to local mode", error);
        clearingBootstrapCache.set(cacheKey, localFallback);
        applyState(localFallback);
        setPresenceUsers([activeUser]);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
      presenceChannelReadyRef.current = false;
      suppressPersistenceRef.current = true;
      if (presenceChannelRef.current) {
        void presenceChannelRef.current.unsubscribe();
        presenceChannelRef.current = null;
      }
    };
  }, [
    applyRemoteElementDelete,
    applyRemoteElementUpsert,
    clearSelection,
    currentUserId,
    currentRoomRef,
    currentUserRef,
    embedded,
    realtimeEnabled,
    resetViewport,
    roomSlug,
    setComments,
    setElements,
    setIsBootstrapping,
    setIsSupabaseLive,
    setPresenceUsers,
    setSaveStatus,
    setRoom,
    setSelectedElement,
    clearingOriginIdRef,
    presenceChannelReadyRef,
    presenceChannelRef,
    pendingDeletesRef,
    pendingUpsertsRef,
    skipRemoteDeletesRef,
    skipRemoteUpsertsRef,
    suppressPersistenceRef,
    setFloatingStamps,
  ]);
}
