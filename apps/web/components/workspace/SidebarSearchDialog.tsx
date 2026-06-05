"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { searchModeLabels, type SearchMode, type PageSearchResult } from "@/lib/sidebarPageTree";
import { FileText, Network, Palette, Database } from "lucide-react";
import type { PageType } from "@obnofi/types";

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  mindmap: <Network className="w-4 h-4" />,
};

interface SearchDialogProps {
  isOpen: boolean;
  query: string;
  mode: SearchMode;
  isLoading: boolean;
  results: PageSearchResult[];
  error: string | null;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSelectPage: (pageId: string) => void;
}

export function SearchDialog({
  isOpen,
  query,
  mode,
  isLoading,
  results,
  error,
  onClose,
  onQueryChange,
  onModeChange,
  onSelectPage,
}: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-start justify-center bg-black/30 px-4 py-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
          <input
            ref={inputRef}
            name="page-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="페이지 제목이나 본문 검색"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
            aria-label="검색 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[var(--color-border)] px-4 py-3">
          {(Object.keys(searchModeLabels) as SearchMode[]).map((searchMode) => {
            const isActive = mode === searchMode;
            return (
              <button
                key={searchMode}
                type="button"
                onClick={() => onModeChange(searchMode)}
                className={`rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                }`}
              >
                {searchModeLabels[searchMode]}
              </button>
            );
          })}
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              검색어를 입력하면 페이지 제목, 본문, 또는 둘 다 기준으로 찾습니다.
            </div>
          ) : isLoading ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              검색 중...
            </div>
          ) : error ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => onSelectPage(result.id)}
                  className="rounded-lg px-3 py-3 text-left hover:bg-[var(--color-hover)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[14px] text-[var(--color-text-secondary)]">
                      {result.icon || typeIcons[result.type]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-text-primary)]">
                      {result.title}
                    </span>
                    <span className="rounded bg-[var(--color-surface)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {searchModeLabels[result.matchedIn]}
                    </span>
                  </div>
                  {result.snippet ? (
                    <p className="mt-1 pl-7 text-[12px] leading-5 text-[var(--color-text-secondary)]">
                      {result.snippet}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
