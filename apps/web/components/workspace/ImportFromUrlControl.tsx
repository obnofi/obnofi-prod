"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { FallingLeavesLoader } from "@/components/FallingLeavesLoader";
import { usePageStore } from "@/store/pageStore";
import { markdownToTiptap } from "@/lib/markdownToTiptap";
import type { ReactNode } from "react";

interface CrawlImportResponse {
  title: string;
  url: string;
  markdown: string;
  crawledAt: string;
  wordCount: number;
}

interface ImportFromUrlControlProps {
  workspaceId: string;
  parentId?: string | null;
  onClose?: () => void;
  className?: string;
  label?: string;
  icon?: ReactNode;
}

function getFallbackTitle(title: string, rawUrl: string) {
  const normalizedTitle = title.trim();
  if (normalizedTitle) {
    return normalizedTitle;
  }

  try {
    return new URL(rawUrl).hostname;
  } catch {
    return rawUrl;
  }
}

export function ImportFromUrlControl({
  workspaceId,
  parentId = null,
  onClose,
  className,
  label,
  icon = <Globe className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />,
}: ImportFromUrlControlProps) {
  const router = useRouter();
  const createPage = usePageStore((state) => state.createPage);
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerClassName = useMemo(
    () =>
      className ??
      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)]",
    [className]
  );

  const handleImport = async () => {
    if (!url.trim()) {
      setError("URL을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/crawl-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "URL을 가져오지 못했습니다.");
      }

      const crawlImport = payload as CrawlImportResponse;
      const newPage = await createPage({
        title: getFallbackTitle(crawlImport.title, crawlImport.url),
        type: "document",
        parentId,
        workspaceId,
        content: markdownToTiptap(crawlImport.markdown),
      });

      if (!newPage) {
        throw new Error("페이지를 생성하지 못했습니다.");
      }

      setUrl("");
      setIsOpen(false);
      onClose?.();
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "URL을 가져오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setError(null);
        }}
        className={triggerClassName}
      >
        {icon}
        {label ? <span>{label}</span> : null}
      </button>

      {isOpen ? (
        <div className="mt-2 rounded-lg bg-[var(--color-surface)] p-2">
          <div className="flex flex-col gap-2">
            <input
              name="import-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              disabled={isLoading}
              className="w-full rounded-md bg-[var(--color-background)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] placeholder:text-[var(--color-text-placeholder)] disabled:cursor-wait disabled:opacity-60"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                disabled={isLoading}
                className="rounded-md px-2 py-1 text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleImport()}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? <FallingLeavesLoader size="sm" className="text-white" /> : null}
                가져오기
              </button>
            </div>
            {error ? (
              <p className="text-[12px] text-red-500">{error}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
