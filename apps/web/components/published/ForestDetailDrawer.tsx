"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { ForestLikeButton } from "@/components/published/ForestLikeButton";
import { PublicReadonlyEditor } from "@/components/share/PublicReadonlyEditor";
import { PublishedCanvasSnapshotView } from "@/components/published/PublishedCanvasSnapshotView";
import { PublishedGraphSnapshotView } from "@/components/published/PublishedGraphSnapshotView";
import type {
  PublishedSnapshotSummary,
  PublishedSnapshotDetail,
  PublishedPageSnapshotContent,
  PublishedGraphSnapshotContent,
} from "@/lib/publishedPageTypes";

const TYPE_CONFIG: Record<string, { label: string; tone: string }> = {
  page: { label: "Grove", tone: "var(--color-accent)" },
  canvas: { label: "Clearing", tone: "var(--color-graph-current)" },
  graph: { label: "Forest", tone: "var(--color-graph-unresolved)" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ForestDetailDrawerProps {
  publication: PublishedSnapshotSummary | null;
  onClose: () => void;
}

export function ForestDetailDrawer({ publication, onClose }: ForestDetailDrawerProps) {
  const [detail, setDetail] = useState<PublishedSnapshotDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publication) {
      setDetail(null);
      return;
    }

    setLoading(true);
    setDetail(null);

    fetch(`/api/published-pages/${publication.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [publication?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (publication) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [publication]);

  if (!publication) return null;

  const typeConf = TYPE_CONFIG[publication.snapshotType] ?? {
    label: publication.snapshotType,
    tone: "var(--color-text-secondary)",
  };

  const pageSnapshot =
    detail && detail.snapshotType !== "graph"
      ? (detail.snapshotContent as PublishedPageSnapshotContent)
      : null;
  const graphSnapshot =
    detail && detail.snapshotType === "graph"
      ? (detail.snapshotContent as PublishedGraphSnapshotContent)
      : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />

      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[700px] flex-col"
        style={{
          background: "var(--color-background)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-4 px-6 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: typeConf.tone }}
            >
              {typeConf.label}
            </span>
            <span className="text-[12px]" style={{ color: "var(--color-text-placeholder)" }}>
              {publication.author.name} · {formatDate(publication.createdAt)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/p/${publication.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium transition hover:opacity-80"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              전체 페이지
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-hover)]"
            >
              <X className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-7 pt-7 pb-5">
            <h2
              className="text-[24px] font-semibold leading-[1.25] tracking-[-0.03em]"
              style={{ color: "var(--color-text-primary)" }}
            >
              {publication.title || "제목 없음"}
            </h2>
            {publication.description ? (
              <p
                className="mt-3 text-[14px] leading-[1.7]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {publication.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {publication.tags.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{
                    background: "var(--color-hover)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  #{t}
                </span>
              ))}
              <div className="ml-auto">
                <ForestLikeButton
                  publishId={publication.id}
                  initialLiked={publication.viewerHasLiked}
                  initialLikeCount={publication.likeCount}
                  compact
                />
              </div>
            </div>
          </div>

          <div
            className="mx-7 mb-12"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            {loading ? (
              <div className="space-y-3 pt-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded-full"
                    style={{
                      background: "var(--color-surface)",
                      width: i % 4 === 0 ? "65%" : i % 3 === 0 ? "80%" : "100%",
                    }}
                  />
                ))}
              </div>
            ) : detail ? (
              <div className="pt-6">
                {graphSnapshot ? (
                  <PublishedGraphSnapshotView snapshot={graphSnapshot} />
                ) : pageSnapshot?.pageType === "canvas" ? (
                  <PublishedCanvasSnapshotView content={pageSnapshot.content} />
                ) : (
                  <PublicReadonlyEditor content={pageSnapshot?.content ?? null} />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
