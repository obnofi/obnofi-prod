import { useCallback, useEffect, useRef } from "react";
import type { Comment, Element, Room } from "@obnofi/types/clearing";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { ClearingElementBroadcast, ClearingSaveStatus } from "@/lib/canvas/clearingBoardTypes";
import {
  assertSupabaseSuccess,
  getClearingBootstrapKey,
  logClearingPersistenceError,
  saveLocalClearingSnapshot,
  toElementInsert,
} from "@/lib/canvas/clearingBoardUtils";
import { clearingBootstrapCache } from "@/lib/canvas/clearingBoardConstants";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PersistenceRefs = {
  presenceChannelRef: React.MutableRefObject<RealtimeChannel | null>;
  presenceChannelReadyRef: React.MutableRefObject<boolean>;
  clearingOriginIdRef: React.MutableRefObject<string>;
  suppressPersistenceRef: React.MutableRefObject<boolean>;
  pendingUpsertsRef: React.MutableRefObject<Map<string, Element>>;
  pendingDeletesRef: React.MutableRefObject<Set<string>>;
  skipRemoteUpsertsRef: React.MutableRefObject<Map<string, string>>;
  skipRemoteDeletesRef: React.MutableRefObject<Set<string>>;
  previousElementsRef: React.MutableRefObject<Element[]>;
  latestCommentsRef: React.MutableRefObject<Comment[]>;
  persistTimerRef: React.MutableRefObject<number | null>;
  currentUserRef: React.MutableRefObject<{ id: string } | null>;
};

export type ClearingPersistenceOptions = {
  roomSlug: string;
  room: Room | null;
  elements: Element[];
  comments: Comment[];
  isBootstrapping: boolean;
  isSupabaseLive: boolean;
  setSaveStatus: React.Dispatch<React.SetStateAction<ClearingSaveStatus>>;
  setIsSupabaseLive: React.Dispatch<React.SetStateAction<boolean>>;
} & PersistenceRefs;

export function useClearingPersistence({
  roomSlug, room, elements, comments,
  isBootstrapping, isSupabaseLive,
  presenceChannelRef, presenceChannelReadyRef,
  clearingOriginIdRef, suppressPersistenceRef,
  pendingUpsertsRef, pendingDeletesRef,
  skipRemoteUpsertsRef, skipRemoteDeletesRef,
  previousElementsRef, latestCommentsRef,
  persistTimerRef, currentUserRef,
  setSaveStatus, setIsSupabaseLive,
}: ClearingPersistenceOptions) {
  const isSupabaseLiveRef = useRef(isSupabaseLive);
  useEffect(() => { isSupabaseLiveRef.current = isSupabaseLive; }, [isSupabaseLive]);

  const persistElement = useCallback(async (element: Element) => {
    if (!isSupabaseLiveRef.current) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const result = await supabase.from("elements").upsert({ ...toElementInsert(element) }, { onConflict: "id" });
      assertSupabaseSuccess(result, "element upsert failed");
    } catch (error) {
      logClearingPersistenceError("persistElement failed", error);
      throw error;
    }
  }, []);

  const removePersistedElement = useCallback(async (elementId: string) => {
    if (!isSupabaseLiveRef.current) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const result = await supabase.from("elements").delete().eq("id", elementId);
      assertSupabaseSuccess(result, "element delete failed");
    } catch (error) {
      logClearingPersistenceError("removePersistedElement failed", error);
      throw error;
    }
  }, []);

  const broadcastElementMutation = useCallback(
    async (payload: ClearingElementBroadcast) => {
      const channel = presenceChannelRef.current;
      if (!channel || !isSupabaseLiveRef.current || !presenceChannelReadyRef.current) return;
      await channel.send({ type: "broadcast", event: "element-mutation", payload });
    },
    [presenceChannelRef, presenceChannelReadyRef]
  );

  const flushCanvasPersistence = useCallback(async () => {
    persistTimerRef.current = null;
    if (!room || isBootstrapping) return;

    const pendingUpserts = Array.from(pendingUpsertsRef.current.values());
    const pendingDeletes = Array.from(pendingDeletesRef.current.values());

    if (pendingUpserts.length === 0 && pendingDeletes.length === 0) {
      if (!isSupabaseLiveRef.current) {
        saveLocalClearingSnapshot(roomSlug, { room, elements, comments: latestCommentsRef.current });
        setSaveStatus("saved");
      }
      return;
    }

    setSaveStatus("saving");

    if (!isSupabaseLiveRef.current) {
      saveLocalClearingSnapshot(roomSlug, { room, elements, comments: latestCommentsRef.current });
      pendingUpsertsRef.current.clear();
      pendingDeletesRef.current.clear();
      setSaveStatus("saved");
      return;
    }

    try {
      await Promise.all([
        ...pendingUpserts.map((el) => persistElement(el)),
        ...pendingDeletes.map((id) => removePersistedElement(id)),
      ]);
      pendingUpsertsRef.current.clear();
      pendingDeletesRef.current.clear();
      setSaveStatus("saved");
    } catch (error) {
      logClearingPersistenceError("flushCanvasPersistence failed, falling back to localStorage", error);
      saveLocalClearingSnapshot(roomSlug, { room, elements, comments: latestCommentsRef.current });
      pendingUpsertsRef.current.clear();
      pendingDeletesRef.current.clear();
      setIsSupabaseLive(false);
      setSaveStatus("saved");
    }
  }, [
    elements, isBootstrapping, room, roomSlug,
    persistElement, removePersistedElement,
    latestCommentsRef, pendingDeletesRef, pendingUpsertsRef,
    persistTimerRef, setSaveStatus, setIsSupabaseLive,
  ]);

  const scheduleCanvasPersistence = useCallback(() => {
    setSaveStatus("unsaved");
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => { void flushCanvasPersistence(); }, 800);
  }, [flushCanvasPersistence, persistTimerRef, setSaveStatus]);

  // Cache update effect
  useEffect(() => {
    const activeUser = currentUserRef.current;
    if (!activeUser || !room || isBootstrapping) return;
    clearingBootstrapCache.set(
      getClearingBootstrapKey(roomSlug, activeUser.id),
      { room, elements, comments, isSupabaseLive }
    );
  }, [comments, currentUserRef, elements, isBootstrapping, isSupabaseLive, room, roomSlug]);

  // Element change detection → pending + broadcast
  useEffect(() => {
    if (isBootstrapping) { previousElementsRef.current = elements; return; }
    if (suppressPersistenceRef.current) { previousElementsRef.current = elements; return; }

    const previousById = new Map(previousElementsRef.current.map((e) => [e.id, e]));
    const nextById = new Map(elements.map((e) => [e.id, e]));
    const localUpserts: Element[] = [];
    const localDeletes: string[] = [];

    for (const element of elements) {
      const previous = previousById.get(element.id);
      const serialized = JSON.stringify(element);
      if (!previous || JSON.stringify(previous) !== serialized) {
        if (skipRemoteUpsertsRef.current.get(element.id) === serialized) {
          skipRemoteUpsertsRef.current.delete(element.id);
          continue;
        }
        pendingUpsertsRef.current.set(element.id, element);
        pendingDeletesRef.current.delete(element.id);
        localUpserts.push(element);
      }
    }

    for (const previous of previousElementsRef.current) {
      if (!nextById.has(previous.id)) {
        if (skipRemoteDeletesRef.current.delete(previous.id)) continue;
        pendingUpsertsRef.current.delete(previous.id);
        pendingDeletesRef.current.add(previous.id);
        localDeletes.push(previous.id);
      }
    }

    if (isSupabaseLive) {
      localUpserts.forEach((element) => {
        void broadcastElementMutation({ kind: "upsert", originId: clearingOriginIdRef.current, element });
      });
      localDeletes.forEach((elementId) => {
        void broadcastElementMutation({ kind: "delete", originId: clearingOriginIdRef.current, elementId });
      });
    }

    if (pendingUpsertsRef.current.size > 0 || pendingDeletesRef.current.size > 0) {
      scheduleCanvasPersistence();
    }

    previousElementsRef.current = elements;
  }, [
    broadcastElementMutation, clearingOriginIdRef, elements, isBootstrapping, isSupabaseLive,
    pendingDeletesRef, pendingUpsertsRef, previousElementsRef,
    scheduleCanvasPersistence, skipRemoteDeletesRef, skipRemoteUpsertsRef, suppressPersistenceRef,
  ]);

  // Comment change (local mode) → persist
  useEffect(() => {
    if (isBootstrapping || isSupabaseLive || !room) return;
    scheduleCanvasPersistence();
  }, [comments, isBootstrapping, isSupabaseLive, room, scheduleCanvasPersistence]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    };
  }, [persistTimerRef]);

  return { persistElement, removePersistedElement, broadcastElementMutation, scheduleCanvasPersistence };
}
