"use client";

import { useEffect, useRef, useState } from "react";
import type { Page } from "@obnofi/types";

export function useGraphPages(
  workspaceId: string,
  queryPageId: string | null,
  setFocusedNote: (id: string) => void
) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSetInitialNote = useRef(false);

  useEffect(() => {
    let mounted = true;
    hasSetInitialNote.current = false;

    const loadPages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/pages?workspaceId=${workspaceId}&includeContent=true`
        );

        if (!response.ok) {
          throw new Error("그래프 데이터를 불러오는 데 실패했습니다.");
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
        if (!mounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "그래프를 불러오는 데 실패했습니다."
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return { pages, isLoading, error };
}
