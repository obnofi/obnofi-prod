"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ForestLikeButton } from "@/components/published/ForestLikeButton";
import type { PublishedSnapshotSummary } from "@/lib/publishedPageTypes";

interface ForestFeedClientProps {
  initialPublications: PublishedSnapshotSummary[];
  initialTags: string[];
  initialSort: "latest" | "popular";
  initialTag: string | null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  const [tags, setTags] = useState(initialTags);

  const sort = searchParams.get("sort") === "popular" ? "popular" : initialSort;
  const tag = searchParams.get("tag") ?? initialTag;

  useEffect(() => {
    const nextSort = searchParams.get("sort") === "popular" ? "popular" : "latest";
    const nextTag = searchParams.get("tag");
    const url = `/api/published-pages?sort=${nextSort}${nextTag ? `&tag=${encodeURIComponent(nextTag)}` : ""}`;

    let cancelled = false;
    startTransition(() => {
      fetch(url)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!data || cancelled) {
            return;
          }
          setPublications(data.publications);
          setTags(data.tags);
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const updateQuery = (next: { sort?: "latest" | "popular"; tag?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.sort) {
      params.set("sort", next.sort);
    }
    if (next.tag) {
      params.set("tag", next.tag);
    } else {
      params.delete("tag");
    }
    router.push(`/forest?${params.toString()}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-10">
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
            Community Forest
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[var(--color-text-primary)]">
            Forest
          </h1>
          <p className="mt-3 max-w-[68ch] text-[15px] text-[var(--color-text-secondary)]">
            다른 사람들이 fossilize한 읽기 전용 snapshot을 둘러보고, 나중에 다시 보고 싶은 것은 저장해 두세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuery({ sort: "latest", tag })}
            className={`rounded-full px-3 py-1 text-[12px] transition ${
              sort === "latest"
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
            }`}
          >
            Latest
          </button>
          <button
            type="button"
            onClick={() => updateQuery({ sort: "popular", tag })}
            className={`rounded-full px-3 py-1 text-[12px] transition ${
              sort === "popular"
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
            }`}
          >
            Popular
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateQuery({ tag: null, sort })}
            className={`rounded-full px-3 py-1 text-[12px] transition ${
              !tag
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
            }`}
          >
            All
          </button>
          {tags.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateQuery({ tag: item, sort })}
              className={`rounded-full px-3 py-1 text-[12px] transition ${
                tag === item
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              }`}
            >
              #{item}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {publications.map((publication) => (
          <article
            key={publication.id}
            className="flex h-full flex-col rounded-2xl bg-[var(--color-surface)] p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                  {publication.snapshotType}
                </p>
                <Link
                  href={`/p/${publication.id}`}
                  className="mt-2 block text-xl font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
                >
                  {publication.title}
                </Link>
              </div>
              <ForestLikeButton
                publishId={publication.id}
                initialLiked={publication.viewerHasLiked}
                initialLikeCount={publication.likeCount}
                compact
              />
            </div>

            <p className="flex-1 text-[14px] leading-6 text-[var(--color-text-secondary)]">
              {publication.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {publication.tags.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateQuery({ tag: item, sort })}
                  className="rounded-full bg-[var(--color-background)] px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
                >
                  #{item}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between text-[12px] text-[var(--color-text-secondary)]">
              <span>{publication.author.name}</span>
              <span>{formatDate(publication.createdAt)}</span>
            </div>
          </article>
        ))}
      </section>

      {publications.length === 0 ? (
        <div className="rounded-2xl bg-[var(--color-surface)] px-6 py-10 text-center text-[14px] text-[var(--color-text-secondary)]">
          {isPending ? "Forest를 불러오는 중입니다." : "아직 게시된 snapshot이 없습니다."}
        </div>
      ) : null}
    </div>
  );
}
