"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Globe2, Trash2 } from "lucide-react";
import type { PublishedSnapshotSummary } from "@/lib/publishedPageTypes";
import type { PageType } from "@obnofi/types";
import { copyToClipboard } from "@/lib/copyToClipboard";

interface PagePublishSectionProps {
  pageId: string;
  workspaceId: string;
  pageType: PageType;
}

function parseTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}

export function PagePublishSection({
  pageId,
  workspaceId,
  pageType,
}: PagePublishSectionProps) {
  const [publication, setPublication] = useState<PublishedSnapshotSummary | null>(null);
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPublication = async () => {
      const response = await fetch(`/api/published-pages?mine=true&pageId=${pageId}`);
      if (!response.ok) {
        return;
      }
      const data = await response.json() as { publication: PublishedSnapshotSummary | null };
      if (cancelled) {
        return;
      }
      setPublication(data.publication);
      if (data.publication) {
        setDescription(data.publication.description);
        setTagInput(data.publication.tags.join(", "));
      }
    };

    void loadPublication();

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const publishUrl = useMemo(
    () =>
      publication
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${publication.id}`
        : "",
    [publication]
  );

  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/published-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "page",
          pageId,
          workspaceId,
          description,
          tags: parseTags(tagInput),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to publish snapshot");
      }

      setPublication(data.publication);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to publish snapshot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!publication) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/published-pages/${publication.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unpublish snapshot");
      }

      setPublication(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to unpublish snapshot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publishUrl) {
      return;
    }
    const copied = await copyToClipboard(publishUrl);
    if (!copied) {
      return;
    }
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  return (
    <div className="px-1 py-1.5">
      <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
        Forest 게시
      </p>

      <div className="rounded-md px-2 py-2">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Globe2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                {pageType === "canvas" ? "Clearing snapshot 게시" : "Snapshot 게시"}
              </p>
              <p className="text-[11px] text-[var(--color-text-placeholder)]">
                원본과 분리된 읽기 전용 fossil snapshot
              </p>
            </div>
          </div>

          {publication ? (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isLoading}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Unpublish
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={160}
            rows={2}
            placeholder="한 줄 설명을 입력하세요."
            className="w-full resize-none rounded-md bg-[var(--color-background)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] placeholder:text-[var(--color-text-placeholder)] focus:ring-[var(--color-accent)]"
          />
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="tags, comma, separated"
            className="w-full rounded-md bg-[var(--color-background)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] placeholder:text-[var(--color-text-placeholder)] focus:ring-[var(--color-accent)]"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isLoading || !description.trim()}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-wait disabled:opacity-60"
          >
            {publication ? "Republish Snapshot" : "Publish Snapshot"}
          </button>

          {publication ? (
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" /> : <Copy className="h-3.5 w-3.5" />}
              {isCopied ? "Copied" : "Copy Link"}
            </button>
          ) : null}
        </div>

        {publication ? (
          <p className="mt-2 text-[11px] text-[var(--color-text-placeholder)]">
            `/p/{publication.id}` 에서 공개됩니다.
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-[11px] text-[var(--color-danger)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
