"use client";

import { JungleRemoteCursor } from "@/components/cursor/JungleRemoteCursor";
import type { AwarenessState } from "@/types/collaboration";
import { useEffect, useMemo, useState } from "react";

type ContextAwarenessState = AwarenessState & { clientId: number; image?: string | null };
const CURSOR_CHAT_FADE_OUT_MS = 220;

interface RemotePageCursorsProps {
  states: ContextAwarenessState[];
}

export function RemotePageCursors({ states }: RemotePageCursorsProps) {
  const [now, setNow] = useState(() => Date.now());

  const visibleStates = useMemo(
    () =>
      states.filter((state) => {
        const expiresAt = state.cursorChat?.expiresAt;
        return expiresAt == null || expiresAt + CURSOR_CHAT_FADE_OUT_MS > now;
      }),
    [now, states]
  );

  useEffect(() => {
    const expirations = visibleStates
      .flatMap((state) => {
        const expiresAt = state.cursorChat?.expiresAt;
        if (typeof expiresAt !== "number") return [];
        return [expiresAt, expiresAt + CURSOR_CHAT_FADE_OUT_MS];
      })
      .filter((value): value is number => typeof value === "number");
    if (expirations.length === 0) return;

    const nextExpiry = Math.min(...expirations);
    const remaining = nextExpiry - Date.now();
    if (remaining <= 0) {
      setNow(Date.now());
      return;
    }

    const timer = window.setTimeout(() => setNow(Date.now()), remaining);
    return () => window.clearTimeout(timer);
  }, [visibleStates]);

  return (
    <>
      {visibleStates.map((state) => {
        const pointer = state.userCursor?.canvasPosition;
        if (!pointer) return null;

        return (
          <JungleRemoteCursor
            key={state.userId}
            color={state.color}
            colorKey={state.cursorColorKey}
            isFadingOut={
              typeof state.cursorChat?.expiresAt === "number" &&
              state.cursorChat.expiresAt <= now
            }
            userId={state.userId}
            userName={state.userName}
            variant={state.cursorVariant}
            x={pointer.x}
            y={pointer.y}
            cursorChatMessage={state.cursorChat?.text ?? null}
          />
        );
      })}
    </>
  );
}
