"use client";

import { useState, useEffect } from "react";
import { usePageStore } from "@/store/pageStore";
import { FileText } from "lucide-react";

interface PageLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pageId: string, pageTitle: string) => void;
  workspaceId: string;
}

export function PageLinkModal({
  isOpen,
  onClose,
  onSelect,
  workspaceId,
}: PageLinkModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { pages, fetchPages } = usePageStore();

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchPages(workspaceId);
    }
  }, [isOpen, workspaceId, fetchPages]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            페이지 링크
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            링크할 페이지를 선택하세요
          </p>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="페이지 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {filteredPages.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              페이지를 찾을 수 없습니다
            </div>
          ) : (
            filteredPages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  onSelect(page.id, page.title);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[var(--color-hover)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                  {page.icon || <FileText className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {page.title || "Untitled"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)]"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
