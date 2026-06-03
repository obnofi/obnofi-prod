import Link from "next/link";
import { PublicReadonlyEditor } from "@/components/share/PublicReadonlyEditor";
import { PageGlyph } from "@/components/workspace/PageGlyph";
import { PublishedCanvasSnapshotView } from "@/components/published/PublishedCanvasSnapshotView";
import { PublishedGraphSnapshotView } from "@/components/published/PublishedGraphSnapshotView";
import { ForestLikeButton } from "@/components/published/ForestLikeButton";
import type { PublishedSnapshotDetail, PublishedGraphSnapshotContent, PublishedPageSnapshotContent } from "@/lib/publishedPageTypes";

interface PublishedSnapshotViewProps {
  publication: PublishedSnapshotDetail;
}

function formatPublishedDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PublishedSnapshotView({
  publication,
}: PublishedSnapshotViewProps) {
  const formattedDate = formatPublishedDate(publication.createdAt);
  const pageSnapshot =
    publication.snapshotType === "graph"
      ? null
      : (publication.snapshotContent as PublishedPageSnapshotContent);
  const graphSnapshot =
    publication.snapshotType === "graph"
      ? (publication.snapshotContent as PublishedGraphSnapshotContent)
      : null;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {pageSnapshot?.coverImage ? (
        <div
          className="h-48 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${pageSnapshot.coverImage})` }}
        />
      ) : (
        <div className="h-10" />
      )}

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-6 pb-20">
        <section className={pageSnapshot?.coverImage ? "-mt-6" : ""}>
          {pageSnapshot ? (
            <div className="mb-4">
              <PageGlyph
                page={{ icon: pageSnapshot.icon, type: pageSnapshot.pageType }}
                emojiClassName="text-5xl leading-none"
                typeClassName="h-10 w-10 text-[var(--color-text-secondary)]"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                Forest Snapshot
              </p>
              <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
                {publication.title}
              </h1>
              <p className="mt-3 max-w-[72ch] text-[15px] text-[var(--color-text-secondary)]">
                {publication.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[var(--color-text-secondary)]">
                <span>{publication.author.name}</span>
                <span>{formattedDate}</span>
                <span className="capitalize">{publication.snapshotType}</span>
              </div>
              {publication.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {publication.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/forest?tag=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <ForestLikeButton
              publishId={publication.id}
              initialLiked={publication.viewerHasLiked}
              initialLikeCount={publication.likeCount}
            />
          </div>
        </section>

        <section>
          {graphSnapshot ? (
            <PublishedGraphSnapshotView snapshot={graphSnapshot} />
          ) : pageSnapshot?.pageType === "canvas" ? (
            <PublishedCanvasSnapshotView content={pageSnapshot.content} />
          ) : (
            <div className="rounded-2xl bg-[var(--color-background)]">
              <PublicReadonlyEditor content={pageSnapshot?.content ?? null} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
