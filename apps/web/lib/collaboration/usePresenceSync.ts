import { useEffect } from "react";
import { WebsocketProvider } from "y-websocket";
import type { UserCursor } from "@/types/collaboration";

interface PresenceUser {
  id: string;
  name: string;
  color: string;
  image?: string | null;
  cursorColorKey?: string;
  cursorVariant?: string;
}

export function usePresenceSync(
  provider: WebsocketProvider | null,
  localPresenceUser: PresenceUser | null
) {
  useEffect(() => {
    if (!provider || !localPresenceUser) return;

    const syncPresenceUser = () => {
      const currentState =
        (provider.awareness.getLocalState() as Record<string, unknown> | null) ?? {};
      provider.awareness.setLocalState({
        ...currentState,
        user: localPresenceUser,
        userCursor:
          (currentState.userCursor as UserCursor | undefined) ?? null,
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
}
