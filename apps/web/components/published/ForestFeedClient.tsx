"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Trees, X } from "lucide-react";
import { ForestLikeButton } from "@/components/published/ForestLikeButton";
import { ForestDetailDrawer } from "@/components/published/ForestDetailDrawer";
import type { PublishedSnapshotSummary } from "@/lib/publishedPageTypes";

interface ForestFeedClientProps {
  initialPublications: PublishedSnapshotSummary[];
  initialTags: string[];
  initialSort: "latest" | "popular";
  initialTag: string | null;
}

function formatDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const TYPE_CONFIG: Record<string, { label: string; tone: string }> = {
  page: { label: "Grove", tone: "var(--color-accent)" },
  canvas: { label: "Clearing", tone: "var(--color-graph-current)" },
  graph: { label: "Forest", tone: "var(--color-graph-unresolved)" },
};

function TagChip({
  tag,
  active,
  onClick,
}: {
  tag: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition"
      style={{
        background: active ? "var(--color-accent-subtle)" : "var(--color-surface)",
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        border: active ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
      }}
    >
      #{tag}
    </button>
  );
}

function PublicationCard({
  publication,
  pushTag,
  onOpen,
}: {
  publication: PublishedSnapshotSummary;
  pushTag: (tag: string) => void;
  onOpen: (p: PublishedSnapshotSummary) => void;
}) {
  const typeConf = TYPE_CONFIG[publication.snapshotType] ?? {
    label: publication.snapshotType,
    tone: "var(--color-text-secondary)",
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(publication)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(publication)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl transition hover:shadow-md focus:outline-none"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderTop: `3px solid ${typeConf.tone}`,
      }}
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: typeConf.tone }}
          >
            {typeConf.label}
          </span>
          <span className="text-[11px]" style={{ color: "var(--color-text-placeholder)" }}>
            {formatDate(publication.createdAt)}
          </span>
        </div>

        <p
          className="line-clamp-2 text-[17px] font-semibold leading-[1.35] tracking-[-0.02em] transition group-hover:opacity-70"
          style={{ color: "var(--color-text-primary)" }}
        >
          {publication.title || "제목 없음"}
        </p>

        {publication.description ? (
          <p
            className="line-clamp-2 text-[13px] leading-[1.6]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {publication.description}
          </p>
        ) : null}

        {publication.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {publication.tags.slice(0, 3).map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushTag(t);
                }}
                className="rounded-full px-2.5 py-1 text-[11px] transition hover:opacity-80"
                style={{
                  background: "var(--color-hover)",
                  color: "var(--color-text-secondary)",
                }}
              >
                #{t}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center justify-between gap-3 px-5 py-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <span className="truncate text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
          {publication.author.name}
        </span>
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ForestLikeButton
            publishId={publication.id}
            initialLiked={publication.viewerHasLiked}
            initialLikeCount={publication.likeCount}
            compact
          />
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  tag,
  searchQuery,
  onClearTag,
  onClearSearch,
}: {
  tag: string | null;
  searchQuery: string;
  onClearTag: () => void;
  onClearSearch: () => void;
}) {
  const heading = searchQuery
    ? `"${searchQuery}" 결과 없음`
    : tag
      ? `#${tag} 태그에 해당하는 Snapshot이 없습니다`
      : "아직 게시된 Snapshot이 없습니다";

  const action = searchQuery ? onClearSearch : tag ? onClearTag : null;
  const actionLabel = searchQuery ? "검색 초기화" : "태그 초기화";

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl px-6 py-16 text-center"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
      >
        <Trees className="h-5 w-5" />
      </div>
      <p className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {heading}
      </p>
      {action ? (
        <button
          type="button"
          onClick={action}
          className="rounded-full px-4 py-1.5 text-[13px] font-medium transition"
          style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ForestFeedClient({
  initialPublications,
  initialTags,
  initialSort,
  initialTag,
}: ForestFeedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [publications, setPublications] = useState(initialPublications);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<PublishedSnapshotSummary | null>(null);

  const sort = searchParams.get("sort") === "popular" ? "popular" : initialSort;
  const tag = searchParams.get("tag") ?? initialTag;

  const displayPublications = searchQuery.trim()
    ? publications.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : publications;

  useEffect(() => {
    const nextSort = searchParams.get("sort") === "popular" ? "popular" : "latest";
    const nextTag = searchParams.get("tag");
    const url = `/api/published-pages?sort=${nextSort}${nextTag ? `&tag=${encodeURIComponent(nextTag)}` : ""}`;

    let cancelled = false;
    startTransition(() => {
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || cancelled) return;
          setPublications(data.publications);
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const pushSort = (next: "latest" | "popular") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    router.push(`?${params.toString()}`);
  };

  const pushTag = (item: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag === item) {
      params.delete("tag");
    } else {
      params.set("tag", item);
    }
    router.push(`?${params.toString()}`);
  };

  const clearTag = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tag");
    router.push(`?${params.toString()}`);
  };

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <>
      <div className="pb-20">
        <div
          className="border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="mx-auto max-w-[1180px] px-5 py-3 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center rounded-full p-1"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {(["latest", "popular"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => pushSort(item)}
                    className="rounded-full px-4 py-1.5 text-[13px] font-medium transition"
                    style={{
                      background: sort === item ? "var(--color-accent)" : "transparent",
                      color: sort === item ? "#fff" : "var(--color-text-secondary)",
                    }}
                  >
                    {item === "latest" ? "최신순" : "인기순"}
                  </button>
                ))}
              </div>

              {tag ? (
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
                  style={{
                    background: "var(--color-accent-subtle)",
                    color: "var(--color-accent)",
                  }}
                >
                  <span>#{tag}</span>
                  <button type="button" onClick={clearTag} aria-label="태그 초기화">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}

              <div
                className="ml-auto flex items-center gap-2 rounded-full px-4 py-2"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Search
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                />
                <input
                  aria-label="Forest 검색"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색"
                  className="w-[140px] bg-transparent text-[13px] outline-none placeholder:text-[var(--color-text-placeholder)]"
                  style={{ color: "var(--color-text-primary)" }}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="검색 초기화"
                  >
                    <X className="h-3.5 w-3.5" style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                ) : null}
              </div>
            </div>

            {initialTags.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {initialTags.map((item) => (
                  <TagChip
                    key={item}
                    tag={item}
                    active={tag === item}
                    onClick={() => pushTag(item)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
          {isPending ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl"
                  style={{ background: "var(--color-surface)" }}
                />
              ))}
            </div>
          ) : displayPublications.length === 0 ? (
            <EmptyState
              tag={tag}
              searchQuery={searchQuery}
              onClearTag={clearTag}
              onClearSearch={() => setSearchQuery("")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayPublications.map((publication) => (
                <PublicationCard
                  key={publication.id}
                  publication={publication}
                  pushTag={pushTag}
                  onOpen={setSelected}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ForestDetailDrawer publication={selected} onClose={handleClose} />
    </>
  );
}
