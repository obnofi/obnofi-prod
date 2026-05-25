import { useState, useEffect } from "react";
import { WebsocketProvider } from "y-websocket";
import type { AwarenessState as CursorAwarenessState, UserCursor } from "@/types/collaboration";
import type {
  JungleCursorColorKey,
  JungleCursorVariant,
} from "@/lib/cursor/jungleCursor";

export interface CollaborationUser {
  clientId: number;
  id?: string;
  name: string;
  color: string;
  image?: string | null;
}

interface ProviderAwarenessState {
  user?: unknown;
  cursor?: { anchor?: unknown; head?: unknown } | null;
  userCursor?: UserCursor | null;
}

export function useCollaborationAwareness(provider: WebsocketProvider | null): {
  collaborators: CollaborationUser[];
  awarenessCount: number;
  awarenessStates: Array<CursorAwarenessState & { clientId: number; image?: string | null }>;
} {
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [awarenessCount, setAwarenessCount] = useState(0);
  const [awarenessStates, setAwarenessStates] = useState<
    Array<CursorAwarenessState & { clientId: number; image?: string | null }>
  >([]);

  useEffect(() => {
    if (!provider) {
      setCollaborators([]);
      setAwarenessCount(0);
      setAwarenessStates([]);
      return;
    }

    const update = () => {
      const states = provider.awareness.getStates();
      const localId = provider.awareness.clientID;
      setAwarenessCount(states.size);
      const users: CollaborationUser[] = [];
      const nextAwarenessStates: Array<
        CursorAwarenessState & { clientId: number; image?: string | null }
      > = [];
      states.forEach((state, clientId) => {
        const awarenessState = state as ProviderAwarenessState;
        const presenceUser = awarenessState.user as
          | {
              id?: unknown;
              name?: unknown;
              color?: unknown;
              image?: unknown;
              cursorColorKey?: unknown;
              cursorVariant?: unknown;
            }
          | undefined;
        const userCursor = awarenessState.userCursor as UserCursor | null | undefined;
        const hasTextCursor = Boolean(
          awarenessState.cursor &&
            (awarenessState.cursor.anchor != null || awarenessState.cursor.head != null)
        );
        const awarenessUserId =
          typeof presenceUser?.id === "string" ? presenceUser.id : null;
        const awarenessUserName =
          typeof presenceUser?.name === "string" ? presenceUser.name : "User";
        const awarenessColor =
          typeof presenceUser?.color === "string" ? presenceUser.color : "#888";
        const awarenessImage =
          typeof presenceUser?.image === "string" ? presenceUser.image : null;
        const awarenessCursorColorKey =
          typeof presenceUser?.cursorColorKey === "string"
            ? (presenceUser.cursorColorKey as JungleCursorColorKey)
            : undefined;
        const awarenessCursorVariant =
          typeof presenceUser?.cursorVariant === "string"
            ? (presenceUser.cursorVariant as JungleCursorVariant)
            : undefined;

        if (awarenessUserId) {
          nextAwarenessStates.push({
            clientId,
            userId: awarenessUserId,
            userName: awarenessUserName,
            color: awarenessColor,
            cursorColorKey: awarenessCursorColorKey,
            cursorVariant: awarenessCursorVariant,
            hasTextCursor,
            userCursor: userCursor ?? null,
            image: awarenessImage,
          });
        }

        if (!presenceUser || clientId === localId) {
          return;
        }

        users.push({
          clientId,
          id: awarenessUserId ?? undefined,
          name: awarenessUserName,
          color: awarenessColor,
          image: awarenessImage,
        });
      });
      setCollaborators(users);
      setAwarenessStates(nextAwarenessStates);
    };

    setCollaborators([]);
    setAwarenessStates([]);
    provider.awareness.on("change", update);
    update();
    return () => provider.awareness.off("change", update);
  }, [provider]);

  return { collaborators, awarenessCount, awarenessStates };
}
