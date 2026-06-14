import { useState, useEffect } from "react";
import { WebsocketProvider } from "y-websocket";
import type {
  AwarenessState as CursorAwarenessState,
  CursorChatState,
  LaserPointerState,
  UserCursor,
} from "@/types/collaboration";
import type {
  JungleCursorColorKey,
  JungleCursorVariant,
} from "@/lib/cursor/jungleCursor";
import { resolveJungleCursorColor } from "@/lib/cursor/jungleCursor";

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
  slashCommand?: { query: string } | null;
  cursorChat?: CursorChatState | null;
  laser?: LaserPointerState | null;
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
        const slashCommand = awarenessState.slashCommand as { query: string } | null | undefined;
        const cursorChat =
          typeof awarenessState.cursorChat?.text === "string" &&
          (awarenessState.cursorChat?.status === "drafting" ||
            awarenessState.cursorChat?.status === "sent") &&
          typeof awarenessState.cursorChat?.updatedAt === "number"
            ? {
                text: awarenessState.cursorChat.text,
                status: awarenessState.cursorChat.status,
                expiresAt:
                  typeof awarenessState.cursorChat.expiresAt === "number"
                    ? awarenessState.cursorChat.expiresAt
                    : null,
                updatedAt: awarenessState.cursorChat.updatedAt,
              }
            : null;
        const laser =
          Array.isArray(awarenessState.laser?.points) &&
          typeof awarenessState.laser?.color === "string" &&
          typeof awarenessState.laser?.expiresAt === "number"
            ? {
                points: awarenessState.laser.points.filter(
                  (p): p is { x: number; y: number } =>
                    typeof p?.x === "number" && typeof p?.y === "number"
                ),
                color: awarenessState.laser.color,
                expiresAt: awarenessState.laser.expiresAt,
                updatedAt:
                  typeof awarenessState.laser.updatedAt === "number"
                    ? awarenessState.laser.updatedAt
                    : 0,
              }
            : null;
        const hasTextCursor = Boolean(
          awarenessState.cursor &&
            (awarenessState.cursor.anchor != null || awarenessState.cursor.head != null)
        );
        const awarenessUserId =
          typeof presenceUser?.id === "string" ? presenceUser.id : null;
        const awarenessUserName =
          typeof presenceUser?.name === "string" ? presenceUser.name : "User";
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
        const awarenessColor = resolveJungleCursorColor(
          awarenessCursorColorKey,
          typeof presenceUser?.color === "string" ? presenceUser.color : "#888"
        );

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
            slashCommand: slashCommand ?? null,
            cursorChat,
            laser,
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
