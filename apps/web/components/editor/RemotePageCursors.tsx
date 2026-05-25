"use client";

import { JungleRemoteCursor } from "@/components/cursor/JungleRemoteCursor";
import type { AwarenessState } from "@/types/collaboration";

type ContextAwarenessState = AwarenessState & { clientId: number; image?: string | null };

interface RemotePageCursorsProps {
  states: ContextAwarenessState[];
}

export function RemotePageCursors({ states }: RemotePageCursorsProps) {
  return (
    <>
      {states.map((state) => {
        const pointer = state.userCursor?.canvasPosition;
        if (!pointer) return null;

        return (
          <JungleRemoteCursor
            key={state.userId}
            color={state.color}
            colorKey={state.cursorColorKey}
            userId={state.userId}
            userName={state.userName}
            variant={state.cursorVariant}
            x={pointer.x}
            y={pointer.y}
          />
        );
      })}
    </>
  );
}
