import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Comment, Element } from "@obnofi/types/clearing";
import type { PresenceUser } from "@/store/usePresenceStore";
import type { SharedTimerState } from "./timerUtils";

type TimerBroadcastPayload = { timer: SharedTimerState };
type TimerRequestPayload = { requesterId: string };

export function subscribeToRealtimeRoom({
  onCommentChange,
  onElementChange,
  onPresenceSync,
  onTimerRequest,
  onTimerState,
  roomId,
  supabase,
  user,
}: {
  onCommentChange: (payload: Record<string, unknown>, eventType: string) => void;
  onElementChange: (payload: Record<string, unknown>, eventType: string) => void;
  onPresenceSync: (users: PresenceUser[]) => void;
  onTimerRequest?: (payload: TimerRequestPayload) => void;
  onTimerState?: (payload: SharedTimerState) => void;
  roomId: string;
  supabase: SupabaseClient;
  user: PresenceUser;
}) {
  const channel = supabase
    .channel(`clearing-room:${roomId}`, {
      config: { presence: { key: user.id } },
    })
    .on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState<Record<string, unknown>>();
      const users = Object.values(presenceState)
        .flat()
        .map((presence) => {
          const presenceUser = presence as unknown as PresenceUser;
          return {
            ...presenceUser,
            lastActiveAt: typeof presenceUser.lastActiveAt === "number"
              ? presenceUser.lastActiveAt
              : Date.now(),
          };
        })
        .filter((presenceUser) => presenceUser.id !== user.id);
      onPresenceSync(users);
    })
    .on("broadcast", { event: "timer-state" }, ({ payload }) => {
      onTimerState?.((payload as TimerBroadcastPayload).timer);
    })
    .on("broadcast", { event: "timer-request" }, ({ payload }) => {
      onTimerRequest?.(payload as TimerRequestPayload);
    })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "elements", filter: `room_id=eq.${roomId}` },
      (payload) => {
        onElementChange((payload.new ?? payload.old) as Record<string, unknown>, payload.eventType);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments", filter: `room_id=eq.${roomId}` },
      (payload) => {
        onCommentChange((payload.new ?? payload.old) as Record<string, unknown>, payload.eventType);
      }
    );

  return channel;
}

export async function trackPresence(channel: RealtimeChannel, presence: PresenceUser) {
  await channel.track({ ...presence, lastActiveAt: Date.now() });
}

export async function persistElementChange(supabase: SupabaseClient, element: Element) {
  await supabase.from("elements").upsert(
    {
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
    },
    { onConflict: "id" }
  );
}

export async function deleteElementsRealtime(supabase: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return;
  await supabase.from("elements").delete().in("id", ids);
}

export async function persistCommentChange(supabase: SupabaseClient, comment: Comment) {
  await supabase.from("comments").upsert(
    {
      id: comment.id,
      room_id: comment.roomId,
      element_id: comment.elementId,
      author_id: comment.authorId,
      body: comment.body,
      x: comment.x,
      y: comment.y,
      created_at: comment.createdAt,
      updated_at: comment.updatedAt,
    },
    { onConflict: "id" }
  );
}

export function throttleFrame<T extends (...args: never[]) => void>(callback: T, fps = 30) {
  const interval = 1000 / fps;
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = performance.now();
    if (now - lastRun < interval) return;
    lastRun = now;
    callback(...args);
  };
}
