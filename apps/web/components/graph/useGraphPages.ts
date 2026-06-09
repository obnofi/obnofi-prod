"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "@obnofi/types";

function describeFailure(status: number): string {
  if (status === 401) {
    return "로그인이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.";
  }
  if (status === 404) {
    return "이 워크스페이스를 찾을 수 없습니다. 접근 권한을 확인해 주세요.";
  }
  if (status >= 500) {
    return "서버에서 그래프 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return `그래프 데이터를 불러오는 데 실패했습니다. (HTTP ${status})`;
}

export function useGraphPages(
  workspaceId: string,
  queryPageId: string | null,
  setFocusedNote: (id: string) => void
) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const hasSetInitialNote = useRef(false);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    hasSetInitialNote.current = false;
    const controller = new AbortController();

    const loadPages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/pages?workspaceId=${encodeURIComponent(workspaceId)}&includeContent=true`,
          { signal: controller.signal, credentials: "include" }
        );

        if (!response.ok) {
          throw new Error(describeFailure(response.status));
        }

        const nextPages = (await response.json()) as Page[];
        if (!mounted) {
          return;
        }

        setPages(nextPages);
        if (!queryPageId && nextPages[0] && !hasSetInitialNote.current) {
          hasSetInitialNote.current = true;
          setFocusedNote(nextPages[0].id);
        }
      } catch (loadError) {
        if (!mounted || (loadError as Error)?.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "그래프를 불러오는 데 실패했습니다."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPages();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, reloadToken]);

  return { pages, isLoading, error, reload };
}
