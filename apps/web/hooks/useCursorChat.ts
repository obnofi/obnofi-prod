"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { CursorChatState } from "@/types/collaboration";

const CURSOR_CHAT_MAX_LENGTH = 52;
const CURSOR_CHAT_TTL_MS = 5000;
const CURSOR_CHAT_FADE_OUT_MS = 220;

function clampCursorChatText(value: string) {
  return value.slice(0, CURSOR_CHAT_MAX_LENGTH);
}

export function useCursorChat(provider: WebsocketProvider | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const clearTimerRef = useRef<number | null>(null);

  const clearScheduledReset = useCallback(() => {
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const syncAwareness = useCallback(
    (nextState: CursorChatState | null) => {
      if (!provider) return;
      provider.awareness.setLocalStateField("cursorChat", nextState);
    },
    [provider]
  );

  const resetCursorChat = useCallback(() => {
    clearScheduledReset();
    setIsOpen(false);
    setDraft("");
    setIsFadingOut(false);
    setMessage(null);
    syncAwareness(null);
  }, [clearScheduledReset, syncAwareness]);

  const scheduleMessageReset = useCallback(
    (expiresAt: number) => {
      clearScheduledReset();
      const remaining = Math.max(0, expiresAt - Date.now());
      clearTimerRef.current = window.setTimeout(() => {
        setIsFadingOut(true);
        clearTimerRef.current = window.setTimeout(() => {
          setIsFadingOut(false);
          setMessage(null);
          syncAwareness(null);
          clearTimerRef.current = null;
        }, CURSOR_CHAT_FADE_OUT_MS);
      }, remaining);
    },
    [clearScheduledReset, syncAwareness]
  );

  const openCursorChat = useCallback(() => {
    clearScheduledReset();
    setIsOpen(true);
    setDraft("");
    setIsFadingOut(false);
    setMessage(null);
    syncAwareness(null);
  }, [clearScheduledReset, syncAwareness]);

  const updateDraft = useCallback(
    (value: string) => {
      const nextDraft = clampCursorChatText(value);
      setDraft(nextDraft);

      if (!nextDraft.trim()) {
        syncAwareness(null);
        return;
      }

      syncAwareness({
        text: nextDraft,
        status: "drafting",
        expiresAt: null,
        updatedAt: Date.now(),
      });
    },
    [syncAwareness]
  );

  const submitCursorChat = useCallback(() => {
    const nextMessage = clampCursorChatText(draft).trim();
    if (!nextMessage) {
      resetCursorChat();
      return;
    }

    const expiresAt = Date.now() + CURSOR_CHAT_TTL_MS;
    clearScheduledReset();
    setIsOpen(false);
    setDraft(nextMessage);
    setIsFadingOut(false);
    setMessage(nextMessage);
    syncAwareness({
      text: nextMessage,
      status: "sent",
      expiresAt,
      updatedAt: Date.now(),
    });
    scheduleMessageReset(expiresAt);
  }, [clearScheduledReset, draft, resetCursorChat, scheduleMessageReset, syncAwareness]);

  useEffect(() => resetCursorChat, [resetCursorChat]);

  const remainingCharacters = useMemo(
    () => CURSOR_CHAT_MAX_LENGTH - draft.length,
    [draft.length]
  );

  return {
    draft,
    isOpen,
    isFadingOut,
    maxLength: CURSOR_CHAT_MAX_LENGTH,
    message,
    remainingCharacters,
    openCursorChat,
    resetCursorChat,
    submitCursorChat,
    updateDraft,
  };
}
