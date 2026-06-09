"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Globe2, Link2, Trash2 } from "lucide-react";
import type { PublishedSnapshotSummary } from "@/lib/publishedPageTypes";
import type { PageType } from "@obnofi/types";
import { copyToClipboard } from "@/lib/copyToClipboard";

interface PagePublishSectionProps {
  pageId: string;
  workspaceId: string;
  pageType: PageType;
  hideLabel?: boolean;
}

function parseTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}

function useBasicPublish(pageId: string) {
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/pages/${pageId}`);
      if (!res.ok || cancelled) return;
      const data = await res.json() as { isPublic?: boolean; shareId?: string | null };
      setIsPublic(data.isPublic ?? false);
      setShareId(data.shareId ?? null);
    };
    void load();
    return () => { cancelled = true; };
  }, [pageId]);

  const shareUrl = useMemo(
    () => shareId ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareId}` : "",
    [shareId]
  );

  const toggle = async () => {
    setIsLoading(true);
    try {
      const next = !isPublic;
      const res = await fetch(`/api/pages/${pageId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) return;
      const data = await res.json() as { shareId: string | null; isPublic: boolean };
      setIsPublic(data.isPublic);
      setShareId(data.shareId);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    const ok = await copyToClipboard(shareUrl);
    if (!ok) return;
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  return { isPublic, shareId, shareUrl, isLoading, isCopied, toggle, copyLink };
}

export function PagePublishSection({
  pageId,
  workspaceId,
  pageType,
  hideLabel = false,
}: PagePublishSectionProps) {
  const basic = useBasicPublish(pageId);

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
      {!hideLabel ? (
        <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
          게시
        </p>
      ) : null}

      <div className="rounded-md px-2 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Globe2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">웹에 게시</p>
              <p className="text-[11px] text-[var(--color-text-placeholder)]">
                링크를 아는 누구나 볼 수 있음
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={basic.toggle}
            disabled={basic.isLoading}
            className={[
              "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50",
              basic.isPublic
                ? "bg-[var(--color-accent)]"
                : "bg-[var(--color-border)]",
            ].join(" ")}
            role="switch"
            aria-checked={basic.isPublic}
          >
            <span
              className={[
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                basic.isPublic ? "translate-x-4" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>

        {basic.isPublic && basic.shareUrl ? (
          <div className="mt-2 flex items-center gap-1">
            <div className="flex flex-1 items-center gap-1.5 overflow-hidden rounded-md bg-[var(--color-background)] px-2 py-1 ring-1 ring-[var(--color-border)]">
              <Link2 className="h-3 w-3 flex-shrink-0 text-[var(--color-text-placeholder)]" />
              <span className="truncate text-[11px] text-[var(--color-text-secondary)]">
                {basic.shareUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={basic.copyLink}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
            >
              {basic.isCopied
                ? <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : null}
      </div>

      <div className="my-1 h-px bg-[var(--color-border)]" />

      {/* ── Forest 게시 ───────────────────────────────────────── */}
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
