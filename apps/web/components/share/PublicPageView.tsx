"use client";

import { PublicReadonlyEditor } from "@/components/share/PublicReadonlyEditor";
import { PageGlyph } from "@/components/workspace/PageGlyph";

interface PublicPageViewProps {
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: object | null;
  updatedAt: string;
}

export function PublicPageView({
  title,
  icon,
  coverImage,
  content,
}: PublicPageViewProps) {
  const fakePage = { icon, type: "document" as const };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {coverImage ? (
        <div
          className="h-48 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      ) : (
        <div className="h-12" />
      )}

      <div className="max-w-4xl mx-auto">
        <article className="px-8 pb-20">
          <div className={coverImage ? "-mt-6 mb-3" : "mb-3"}>
            <PageGlyph
              page={fakePage}
              emojiClassName="text-5xl leading-none"
              typeClassName="w-10 h-10 text-[var(--color-text-secondary)]"
            />
          </div>

          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-8">
            {title}
          </h1>

          <div className="text-[var(--color-text-primary)] leading-relaxed">
            <PublicReadonlyEditor content={content} />
          </div>
        </article>
      </div>
    </div>
  );
}
