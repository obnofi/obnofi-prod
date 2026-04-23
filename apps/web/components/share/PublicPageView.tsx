"use client";

import { Editor } from "@/components/editor/Editor";

interface PublicPageViewProps {
  title: string;
  content: object | null;
  updatedAt: string;
}

export function PublicPageView({
  title,
  content,
  updatedAt,
}: PublicPageViewProps) {
  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#111110]">
      <div className="max-w-4xl mx-auto">
        <div className="h-48 bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-[#111110]" />

        <article className="px-8 pb-20 -mt-20">
          <h1 className="text-4xl font-bold text-[#111110] dark:text-zinc-100 mb-4">
            {title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-8">
            <span>Last edited {formattedDate}</span>
          </div>

          <div className="text-[#111110] dark:text-zinc-300 leading-relaxed">
            <Editor content={content} editable={false} />
          </div>
        </article>
      </div>
    </div>
  );
}
