"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useSession } from "next-auth/react";
import { useJungleCursor } from "@/lib/cursor/jungleCursor";
import { pickProfileImagePreset } from "@/lib/profileImagePresets";
import { getUserColor } from "@/lib/collaborationUtils";
import type {
  AwarenessState as CursorAwarenessState,
  LaserPointerState,
  UserCursor,
} from "@/types/collaboration";
import { resolveCollaborationServerUrl } from "./wsUrl";
import {
  useCollaborationAwareness,
  type CollaborationUser,
} from "./useCollaborationAwareness";
import { useProviderConnection } from "./useProviderConnection";
import { usePresenceSync } from "./usePresenceSync";

export type { CollaborationUser };

export function userColor(seed: string): string {
  return getUserColor(seed);
}

interface CollaborationContextValue {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  isSynced: boolean;
  pageType: "document" | "canvas" | "database" | "mindmap" | null;
  awarenessCount: number;
  awarenessStates: Array<CursorAwarenessState & { clientId: number; image?: string | null }>;
  updateCursor: (fields: Partial<UserCursor> | null) => void;
  updateLaser: (state: LaserPointerState | null) => void;
  localUserId: string | null;
}

interface ProviderAwarenessState {
  user?: unknown;
  cursor?: unknown;
  userCursor?: UserCursor | null;
  cursorChat?: unknown;
  laser?: unknown;
}

const defaultDocumentContext: CollaborationContextValue = {
  ydoc: null,
  provider: null,
  isSynced: false,
  pageType: null,
  awarenessCount: 0,
  awarenessStates: [],
  updateCursor: () => {},
  updateLaser: () => {},
  localUserId: null,
};

const CollaborationContext = createContext<CollaborationContextValue>({
  ...defaultDocumentContext,
});

const CollaborationPresenceContext = createContext<CollaborationUser[]>([]);

export function CollaborationProvider({
  pageId,
  active,
  pageType = null,
  children,
}: {
  pageId: string;
  active: boolean;
  pageType?: "document" | "canvas" | "database" | "mindmap" | null;
  children: ReactNode;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const jungleCursor = useJungleCursor();
  const [isSynced, setIsSynced] = useState(false);

  const localPresenceUser = useMemo(() => {
    if (!session?.user) {
      return null;
    }

    const name = session.user.name ?? session.user.email ?? "Anonymous";
    const seed = session.user.email ?? session.user.id ?? name;
    const color = jungleCursor.color;
    const image =
      typeof session.user.image === "string" && session.user.image.length > 0
        ? session.user.image
        : pickProfileImagePreset(seed);

    return {
      id: session.user.id ?? session.user.email ?? seed,
      name,
      color,
      image,
      cursorColorKey: jungleCursor.colorKey,
      cursorVariant: jungleCursor.variant,
    };
  }, [jungleCursor.color, jungleCursor.colorKey, jungleCursor.variant, session]);

  const collaborationUserId =
    localPresenceUser?.id ?? session?.user?.id ?? session?.user?.email ?? null;
  const collaborationReady = active && sessionStatus !== "loading" && Boolean(collaborationUserId);

  // active=false인 페이지(문서 타입이 아님 / 공유편집 비활성)는 ydoc·provider를 만들지 않는다.
  const ydoc = useMemo(
    () => (collaborationReady ? new Y.Doc() : null),
    [collaborationReady]
  );

  const provider = useMemo(() => {
    if (!ydoc) return null;
    const wsUrl = resolveCollaborationServerUrl();
    return new WebsocketProvider(wsUrl, pageId, ydoc, {
      connect: false,
      params: {
        userId: collaborationUserId ?? "",
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ydoc, pageId, collaborationUserId]);

  useProviderConnection(provider, ydoc, setIsSynced);
  usePresenceSync(provider, localPresenceUser);

  const { collaborators, awarenessCount, awarenessStates } =
    useCollaborationAwareness(provider);

  const updateCursor = useMemo(
    () => (fields: Partial<UserCursor> | null) => {
      if (!provider) {
        return;
      }

      const currentState =
        (provider.awareness.getLocalState() as ProviderAwarenessState | null) ?? null;

      if (fields === null) {
        provider.awareness.setLocalStateField("userCursor", null);
        return;
      }

      const nextCursor: UserCursor = {
        type:
          currentState?.userCursor?.type ??
          (pageType === "canvas" || pageType === "database" ? pageType : "page"),
        pageId: currentState?.userCursor?.pageId ?? pageId,
        canvasPosition: currentState?.userCursor?.canvasPosition ?? null,
        databaseCell: currentState?.userCursor?.databaseCell ?? null,
        ...fields,
      };

      provider.awareness.setLocalStateField("userCursor", nextCursor);
    },
    [pageId, pageType, provider]
  );

  const updateLaser = useMemo(
    () => (state: LaserPointerState | null) => {
      if (!provider) {
        return;
      }
      provider.awareness.setLocalStateField("laser", state);
    },
    [provider]
  );

  const value = useMemo(
    () => ({
      ydoc,
      provider,
      isSynced,
      pageType,
      awarenessCount,
      awarenessStates,
      updateCursor,
      updateLaser,
      localUserId: localPresenceUser?.id ?? null,
    }),
    [
      ydoc,
      provider,
      isSynced,
      pageType,
      awarenessCount,
      awarenessStates,
      updateCursor,
      updateLaser,
      localPresenceUser?.id,
    ]
  );

  return (
    <CollaborationContext.Provider value={value}>
      <CollaborationPresenceContext.Provider value={collaborators}>
        {children}
      </CollaborationPresenceContext.Provider>
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  return useContext(CollaborationContext);
}

export function useCollaborators() {
  return useContext(CollaborationPresenceContext);
}
