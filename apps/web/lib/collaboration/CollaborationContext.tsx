"use client";

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useSession } from "next-auth/react";
import { pickProfileImagePreset } from "@/lib/profileImagePresets";
import { getUserColor } from "@/lib/collaborationUtils";
import type {
  AwarenessState as CursorAwarenessState,
  UserCursor,
} from "@/types/collaboration";
import { resolveCollaborationServerUrl } from "./wsUrl";
import {
  useCollaborationAwareness,
  type CollaborationUser,
} from "./useCollaborationAwareness";

export type { CollaborationUser };

export function userColor(seed: string): string {
  return getUserColor(seed);
}

interface CollaborationContextValue {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  isSynced: boolean;
  pageType: "document" | "canvas" | "database" | null;
  awarenessCount: number;
  awarenessStates: Array<CursorAwarenessState & { clientId: number; image?: string | null }>;
  updateCursor: (fields: Partial<UserCursor> | null) => void;
  localUserId: string | null;
}

interface ProviderAwarenessState {
  user?: unknown;
  cursor?: unknown;
  userCursor?: UserCursor | null;
}

const defaultDocumentContext: CollaborationContextValue = {
  ydoc: null,
  provider: null,
  isSynced: false,
  pageType: null,
  awarenessCount: 0,
  awarenessStates: [],
  updateCursor: () => {},
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
  pageType?: "document" | "canvas" | "database" | null;
  children: ReactNode;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [isSynced, setIsSynced] = useState(false);

  const localPresenceUser = useMemo(() => {
    if (!session?.user) {
      return null;
    }

    const name = session.user.name ?? session.user.email ?? "Anonymous";
    const seed = session.user.email ?? session.user.id ?? name;
    const color = userColor(seed);
    const image =
      typeof session.user.image === "string" && session.user.image.length > 0
        ? session.user.image
        : pickProfileImagePreset(seed);

    return {
      id: session.user.id ?? session.user.email ?? seed,
      name,
      color,
      image,
    };
  }, [session]);

  const collaborationUserId =
    localPresenceUser?.id ?? session?.user?.id ?? session?.user?.email ?? null;
  const collaborationReady = active && sessionStatus !== "loading" && Boolean(collaborationUserId);

  // active=false인 페이지(문서 타입이 아님 / 공유편집 비활성)는 ydoc·provider를 만들지 않는다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ydoc = useMemo(
    () => (collaborationReady ? new Y.Doc() : null),
    [pageId, collaborationReady]
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

  // strict mode 재마운트 대응: destroy를 다음 tick으로 지연시켜 같은 인스턴스 재사용을 허용.
  const pendingDestroyRef = useRef<{
    provider: WebsocketProvider;
    ydoc: Y.Doc;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  useEffect(() => {
    if (!provider || !ydoc) {
      setIsSynced(false);
      return;
    }

    const pending = pendingDestroyRef.current;
    if (pending) {
      clearTimeout(pending.timer);
      pendingDestroyRef.current = null;
      if (pending.provider !== provider) {
        pending.provider.disconnect();
        pending.provider.destroy();
      }
      if (pending.ydoc !== ydoc) {
        pending.ydoc.destroy();
      }
    }

    provider.connect();

    const handlePageHide = () => {
      setIsSynced(false);
      provider.disconnect();
    };

    const handlePageShow = () => {
      provider.connect();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      provider.awareness.setLocalState(null);
      setIsSynced(false);
      const timer = setTimeout(() => {
        provider.disconnect();
        provider.destroy();
        ydoc.destroy();
        if (pendingDestroyRef.current?.provider === provider) {
          pendingDestroyRef.current = null;
        }
      }, 0);
      pendingDestroyRef.current = { provider, ydoc, timer };
    };
  }, [provider, ydoc]);

  useEffect(() => {
    if (!provider) {
      setIsSynced(false);
      return;
    }
    const handleSync = (synced: boolean) => setIsSynced(synced);
    provider.on('sync', handleSync);

    const handleStatus = ({ status }: { status: string }) => {
      if (status === 'disconnected') setIsSynced(true);
    };
    provider.on('status', handleStatus);
    const fallbackTimer = setTimeout(() => setIsSynced(true), 5000);

    return () => {
      provider.off('sync', handleSync);
      provider.off('status', handleStatus);
      clearTimeout(fallbackTimer);
    };
  }, [provider]);

  useEffect(() => {
    if (!provider || !localPresenceUser) return;

    const syncPresenceUser = () => {
      const currentState =
        (provider.awareness.getLocalState() as Record<string, unknown> | null) ?? {};
      provider.awareness.setLocalState({
        ...currentState,
        user: localPresenceUser,
        userCursor:
          (currentState.userCursor as CursorAwarenessState["userCursor"] | undefined) ?? null,
      });
    };

    syncPresenceUser();
    provider.on("sync", syncPresenceUser);
    provider.on("status", syncPresenceUser);

    return () => {
      provider.off("sync", syncPresenceUser);
      provider.off("status", syncPresenceUser);
    };
  }, [localPresenceUser, provider]);

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

  const value = useMemo(
    () => ({
      ydoc,
      provider,
      isSynced,
      pageType,
      awarenessCount,
      awarenessStates,
      updateCursor,
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
