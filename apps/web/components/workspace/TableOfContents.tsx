"use client";

import { useTOC } from "@/hooks/useTOC";

interface TableOfContentsProps {
  container: HTMLElement | null;
}

const indentClasses: Record<1 | 2 | 3, string> = {
  1: "pl-0",
  2: "pl-3",
  3: "pl-6",
};

export function TableOfContents({ container }: TableOfContentsProps) {
  const { headings, activeHeadingId } = useTOC(container);

  if (headings.length <= 1) {
    return null;
  }

  return (
    <aside className="fixed right-8 top-40 hidden w-56 lg:block">
      <nav aria-label="Table of contents" className="max-h-[calc(100vh-8rem)] overflow-hidden">
        <ul className="space-y-1">
          {headings.map((heading) => {
            const isActive = heading.id === activeHeadingId;

            return (
              <li key={heading.id}>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById(heading.id)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className={`block w-full truncate rounded-md py-1 text-left text-[12px] leading-5 transition ${indentClasses[heading.level]} ${
                    isActive
                      ? "font-semibold text-[var(--color-text-primary)]"
                      : "font-normal text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                  title={heading.text}
                >
                  {heading.text}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
