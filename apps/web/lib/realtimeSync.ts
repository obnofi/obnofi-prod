import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Comment, Element, Room, User } from "@obnofi/types/clearing";
import type { PresenceUser } from "@/store/usePresenceStore";
import type { Point } from "@obnofi/types/clearing";

export type CursorChatMessage = {
  message: string;
  createdAt: number;
};

export type SharedTimerState = {
  durationMs: number;
  remainingMs: number;
  isRunning: boolean;
  startedAt: number | null;
  updatedAt: number;
};

type TimerBroadcastPayload = {
  timer: SharedTimerState;
};

type TimerRequestPayload = {
  requesterId: string;
};

export function randomPresenceColor() {
  const colors = ["#2E7D45", "#2563EB", "#DC2626", "#D97706", "#7C3AED", "#DB2777"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function randomPresenceName() {
  const names = ["Mina", "Theo", "Iris", "Jun", "Luca", "Nari", "Sora"];
  return names[Math.floor(Math.random() * names.length)];
}

export function createPresenceUser(user?: User | null): PresenceUser {
  return {
    id: user?.id ?? crypto.randomUUID(),
    name: user?.name ?? randomPresenceName(),
    color: user?.color ?? randomPresenceColor(),
    cursor: user?.cursor ?? null,
    selectedIds: [],
    lastActiveAt: Date.now(),
  };
}

export function createSharedTimerState(durationMinutes = 5): SharedTimerState {
  const durationMs = durationMinutes * 60_000;
  return {
    durationMs,
    remainingMs: durationMs,
    isRunning: false,
    startedAt: null,
    updatedAt: Date.now(),
  };
}

export function getRemainingTimerMs(timer: SharedTimerState, now = Date.now()) {
  if (!timer.isRunning || timer.startedAt === null) {
    return Math.max(0, timer.remainingMs);
  }

  return Math.max(0, timer.remainingMs - (now - timer.startedAt));
}

export function startSharedTimer(timer: SharedTimerState, now = Date.now()): SharedTimerState {
  if (timer.isRunning) {
    return timer;
  }

  const remainingMs = Math.max(0, timer.remainingMs);
  return {
    ...timer,
    remainingMs,
    isRunning: remainingMs > 0,
    startedAt: remainingMs > 0 ? now : null,
    updatedAt: now,
  };
}

export function pauseSharedTimer(timer: SharedTimerState, now = Date.now()): SharedTimerState {
  return {
    ...timer,
    remainingMs: getRemainingTimerMs(timer, now),
    isRunning: false,
    startedAt: null,
    updatedAt: now,
  };
}

export function resetSharedTimer(timer: SharedTimerState, now = Date.now()): SharedTimerState {
  return {
    ...timer,
    remainingMs: timer.durationMs,
    isRunning: false,
    startedAt: null,
    updatedAt: now,
  };
}

export function setSharedTimerDuration(
  timer: SharedTimerState,
  durationMinutes: number,
  now = Date.now()
): SharedTimerState {
  const durationMs = Math.max(10_000, Math.round(durationMinutes * 60_000));
  return {
    durationMs,
    remainingMs: durationMs,
    isRunning: false,
    startedAt: null,
    updatedAt: now,
  };
}

export function normalizePresenceUser(record: Record<string, unknown>): User {
  const cursorRecord = record.cursor as Point | undefined;
  const cursorChatRecord = record.cursorChat as CursorChatMessage | null | undefined;

  return {
    id: String(record.id ?? crypto.randomUUID()),
    name: String(record.name ?? randomPresenceName()),
    email: (record.email as string | null) ?? null,
    avatarUrl: (record.avatarUrl as string | null) ?? null,
    color: (record.color as User["color"]) ?? randomPresenceColor(),
    cursor: cursorRecord
      ? {
          x: Number(cursorRecord.x),
          y: Number(cursorRecord.y),
        }
      : undefined,
    cursorChat: cursorChatRecord
      ? {
          message: String(cursorChatRecord.message ?? ""),
          createdAt: Number(cursorChatRecord.createdAt ?? Date.now()),
        }
      : null,
    connectedAt: String(record.connectedAt ?? new Date().toISOString()),
    lastSeenAt: String(record.lastSeenAt ?? new Date().toISOString()),
  };
}

export async function broadcastTimerState(
  channel: RealtimeChannel,
  timer: SharedTimerState
) {
  await channel.send({
    type: "broadcast",
    event: "timer-state",
    payload: {
      timer,
    } satisfies TimerBroadcastPayload,
  });
}

export async function requestTimerState(channel: RealtimeChannel, requesterId: string) {
  await channel.send({
    type: "broadcast",
    event: "timer-request",
    payload: {
      requesterId,
    } satisfies TimerRequestPayload,
  });
}

export async function syncPresenceUserProfile(
  supabase: SupabaseClient,
  user: PresenceUser,
  email?: string | null,
  avatarUrl?: string | null
) {
  await supabase.from("users").upsert(
    {
      id: user.id,
      name: user.name,
      email,
      avatar_url: avatarUrl,
      color: user.color,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

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
      config: {
        presence: {
          key: user.id,
        },
      },
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
      {
        event: "*",
        schema: "public",
        table: "elements",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onElementChange((payload.new ?? payload.old) as Record<string, unknown>, payload.eventType);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onCommentChange((payload.new ?? payload.old) as Record<string, unknown>, payload.eventType);
      }
    );

  return channel;
}

export async function trackPresence(
  channel: RealtimeChannel,
  presence: PresenceUser
) {
  await channel.track({
    ...presence,
    lastActiveAt: Date.now(),
  });
}

export async function persistElementChange(
  supabase: SupabaseClient,
  element: Element
) {
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

export async function deleteElementsRealtime(
  supabase: SupabaseClient,
  ids: string[]
) {
  if (ids.length === 0) {
    return;
  }
  await supabase.from("elements").delete().in("id", ids);
}

export async function persistCommentChange(
  supabase: SupabaseClient,
  comment: Comment
) {
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
    if (now - lastRun < interval) {
      return;
    }
    lastRun = now;
    callback(...args);
  };
}
