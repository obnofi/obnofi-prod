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


export function userColor(seed: string): string {
  return getUserColor(seed);
}

export interface CollaborationUser {
  clientId: number;
  id?: string;
  name: string;
  color: string;
  image?: string | null;
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

function resolveCollaborationServerUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (configuredUrl) {
    const normalized = configuredUrl.replace(/\/+$/, "");
    return normalized.endsWith("/ws") ? normalized : `${normalized}/ws`;
  }

  if (typeof window === "undefined") {
    return "ws://localhost:3001/ws";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const { hostname, host } = window.location;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  const baseUrl = isLocalHost ? `${protocol}//${hostname}:3001` : `${protocol}//${host}`;
  return `${baseUrl}/ws`;
}

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
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [awarenessCount, setAwarenessCount] = useState(0);
  const [awarenessStates, setAwarenessStates] = useState<
    Array<CursorAwarenessState & { clientId: number; image?: string | null }>
  >([]);
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

  // React 18 strict mode의 mount→cleanup→re-mount 더블 사이클에서
  // 같은 ydoc/provider 인스턴스가 destroy된 후 재사용되어 doc.update 핸들러가 사라지는
  // 버그를 회피하기 위해 destroy를 마이크로태스크 다음 tick으로 지연시킨다.
  // 같은 페어로 다시 mount되면 destroy를 취소해 인스턴스를 살려둔다 (드롭아웃 없음).
  // 페어 자체가 바뀌면(pageId 변경 등) 취소되지 않고 정상적으로 destroy된다.
  const pendingDestroyRef = useRef<{
    provider: WebsocketProvider;
    ydoc: Y.Doc;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  useEffect(() => {
    if (!provider || !ydoc) {
      setCollaborators([]);
      setIsSynced(false);
      setAwarenessCount(0);
      setAwarenessStates([]);
      return;
    }

    // 예약된 destroy 처리 — strict mode 재마운트 회복 및 세션 로드 후 provider 교체 대응.
    // provider만 바뀌고 ydoc은 같은 경우(session 로드 후 userId 확정): 이전 provider만 destroy.
    // 둘 다 같은 경우(strict mode toss): timer만 취소하여 인스턴스 유지.
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
      // 페이지 전환 직후 이전 세션이 유령 협업자로 남지 않도록 로컬 awareness를 먼저 제거한다.
      provider.awareness.setLocalState(null);
      setCollaborators([]);
      setIsSynced(false);
      setAwarenessCount(0);
      setAwarenessStates([]);
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

    // WS 연결 실패 시 저장이 영원히 막히므로, disconnected 즉시 + 5초 타임아웃 이중 폴백
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
          | { id?: unknown; name?: unknown; color?: unknown; image?: unknown }
          | undefined;
        const userCursor = awarenessState.userCursor as UserCursor | null | undefined;
        const awarenessUserId =
          typeof presenceUser?.id === "string" ? presenceUser.id : null;
        const awarenessUserName =
          typeof presenceUser?.name === "string" ? presenceUser.name : "User";
        const awarenessColor =
          typeof presenceUser?.color === "string" ? presenceUser.color : "#888";
        const awarenessImage =
          typeof presenceUser?.image === "string" ? presenceUser.image : null;

        if (awarenessUserId) {
          nextAwarenessStates.push({
            clientId,
            userId: awarenessUserId,
            userName: awarenessUserName,
            color: awarenessColor,
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
