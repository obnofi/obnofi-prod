"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Database, X, Loader2 } from "lucide-react";
import { Page } from "@obnofi/types";

interface LinkDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (databaseId: string, pageId: string) => void;
  workspaceId: string;
}

interface DatabaseItem {
  id: string;
  title: string;
  icon: string | null;
  databaseId: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function LinkDatabaseModal({
  isOpen,
  onClose,
  onSelect,
  workspaceId,
}: LinkDatabaseModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DatabaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  const searchDatabases = useCallback(
    async (searchQuery: string) => {
      if (!workspaceId) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/databases/search?q=${encodeURIComponent(searchQuery)}&workspaceId=${workspaceId}`
        );
        if (!response.ok) throw new Error("Failed to search");

        const data = (await response.json()) as DatabaseItem[];
        setResults(data);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    if (isOpen) {
      searchDatabases(debouncedQuery);
    }
  }, [debouncedQuery, isOpen, searchDatabases]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev >= results.length - 1 ? 0 : prev + 1
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? results.length - 1 : prev - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            onSelect(selected.databaseId, selected.id);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Search className="h-5 w-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="데이터베이스 검색..."
            className="flex-1 bg-transparent text-[15px] text-[#111110] outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={listRef}
          className="max-h-[320px] overflow-y-auto py-2"
        >
          {results.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <Database className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {query ? `"${query}"에 대한 검색 결과가 없습니다` : "데이터베이스가 없습니다"}
              </p>
            </div>
          ) : (
            results.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.databaseId, item.id);
                  onClose();
                }}
                className={[
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                ].join(" ")}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-800">
                  {item.icon || "🗂️"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#111110] dark:text-zinc-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    데이터베이스
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-700 dark:bg-zinc-800">
                ↑↓
              </kbd>
              <span>선택</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-700 dark:bg-zinc-800">
                ↵
              </kbd>
              <span>확인</span>
            </span>
          </div>
          <span>{results.length}개의 데이터베이스</span>
        </div>
      </div>
    </div>
  );
}
