"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorSaveStore } from "@/store/useEditorSaveStore";

interface UseAutoSaveOptions {
  pageId: string;
  getContent: () => object;
  onSaved?: (content: object) => void;
  debounceMs?: number;
  intervalMs?: number;
}

export function useAutoSave({
  pageId,
  getContent,
  onSaved,
  debounceMs = 1500,
  intervalMs = 30_000,
}: UseAutoSaveOptions) {
  const { markDirty, markSaving, markSaved, markError, isDirty, reset } =
    useEditorSaveStore();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(isDirty);
  const getContentRef = useRef(getContent);
  const pageIdRef = useRef(pageId);
  const onSavedRef = useRef(onSaved);

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { getContentRef.current = getContent; }, [getContent]);
  useEffect(() => { pageIdRef.current = pageId; }, [pageId]);
  useEffect(() => { onSavedRef.current = onSaved; }, [onSaved]);

  const persistContent = useCallback(
    async (
      targetPageId: string,
      content: object,
      options?: { background?: boolean; updateStatus?: boolean }
    ) => {
      const { background = false, updateStatus = true } = options ?? {};

      if (updateStatus) {
        markSaving();
      }

      try {
        const res = await fetch(`/api/pages/${targetPageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          keepalive: background,
        });
        if (!res.ok) {
          throw new Error("save failed");
        }
        if (updateStatus) {
          markSaved();
        }
        onSavedRef.current?.(content);
        return true;
      } catch {
        if (updateStatus) {
          markError();
        }
        return false;
      }
    },
    [markError, markSaved, markSaving]
  );

  const flushPendingSave = useCallback(
    (targetPageId = pageIdRef.current) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (!isDirtyRef.current) {
        return;
      }
      const content = getContentRef.current();
      void persistContent(targetPageId, content, {
        background: true,
        updateStatus: false,
      });
    },
    [persistContent]
  );

  // 페이지 전환 시 상태 초기화, 대기 중인 타이머 정리
  useEffect(() => {
    reset();
    return () => {
      flushPendingSave(pageId);
    };
  // reset은 store 액션이라 안정적 — pageId 변경 시에만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, flushPendingSave]);

  const save = useCallback(async () => {
    if (!isDirtyRef.current) return;
    const content = getContentRef.current();
    debounceTimerRef.current = null;
    await persistContent(pageIdRef.current, content);
  }, [persistContent]);

  // 변경 감지 시 호출 — debounce 1.5초
  const scheduleSave = useCallback(() => {
    markDirty();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void save();
    }, debounceMs);
  }, [debounceMs, markDirty, save]);

  // 30초 interval 강제 저장 (dirty일 때만)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current) void save();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs, save]);

  // 페이지 이탈 직전 저장 (keepalive로 언로드 중에도 완료)
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingSave();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [flushPendingSave]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [flushPendingSave]);

  return { scheduleSave, save };
}
