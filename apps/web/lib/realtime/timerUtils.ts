import type { RealtimeChannel } from "@supabase/supabase-js";

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

export async function broadcastTimerState(
  channel: RealtimeChannel,
  timer: SharedTimerState
) {
  await channel.send({
    type: "broadcast",
    event: "timer-state",
    payload: { timer } satisfies TimerBroadcastPayload,
  });
}

export async function requestTimerState(channel: RealtimeChannel, requesterId: string) {
  await channel.send({
    type: "broadcast",
    event: "timer-request",
    payload: { requesterId } satisfies TimerRequestPayload,
  });
}
