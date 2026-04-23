"use client";

import { useState, useEffect, useRef } from "react";
import { Link2, X } from "lucide-react";

interface ButtonInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (label: string, url: string) => void;
}

export function ButtonInsertModal({
  isOpen,
  onClose,
  onConfirm,
}: ButtonInsertModalProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLabel("");
      setUrl("");
      setTimeout(() => labelRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!label.trim()) return;
    onConfirm(label.trim(), url.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[22vh]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            버튼 설정
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid gap-3 px-4 py-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              라벨
            </span>
            <input
              ref={labelRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="버튼 라벨"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
              <Link2 className="h-3.5 w-3.5" />
              링크 (선택)
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)]"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!label.trim()}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
