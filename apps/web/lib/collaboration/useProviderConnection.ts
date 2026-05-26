import { useEffect, useRef } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

export function useProviderConnection(
  provider: WebsocketProvider | null,
  ydoc: Y.Doc | null,
  setIsSynced: (synced: boolean) => void
) {
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
  }, [provider, ydoc, setIsSynced]);

  useEffect(() => {
    if (!provider) {
      setIsSynced(false);
      return;
    }
    const handleSync = (synced: boolean) => setIsSynced(synced);
    provider.on("sync", handleSync);

    return () => {
      provider.off("sync", handleSync);
    };
  }, [provider, setIsSynced]);
}
