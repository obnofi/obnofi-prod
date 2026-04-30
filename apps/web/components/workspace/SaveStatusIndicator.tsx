"use client";

import { useEditorSaveStore } from "@/store/useEditorSaveStore";

interface SaveStatusIndicatorProps {
  onRetry: () => void;
}

export function SaveStatusIndicator({ onRetry }: SaveStatusIndicatorProps) {
  const status = useEditorSaveStore((s) => s.status);

  if (status === "saving") {
    return (
      <span className="text-xs text-[var(--color-text-secondary)]">
        ... 저장 중
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="text-xs text-[var(--color-text-secondary)]">
        ● 수정됨
      </span>
    );
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="text-xs text-red-500 hover:underline"
      >
        저장 실패 — 재시도
      </button>
    );
  }
  // saved
  return (
    <span className="text-xs text-[var(--color-text-secondary)]">
      ✓ 저장됨
    </span>
  );
}
