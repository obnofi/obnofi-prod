"use client";

import type { EmbedElement as EmbedElementType } from "@obnofi/types/clearing";

export function EmbedElement({
  element,
  isSelected,
  onPointerDown,
}: {
  element: EmbedElementType;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
}) {
  return (
    <div
      className="relative h-full w-full cursor-grab active:cursor-grabbing"
      style={{
        opacity: element.style.opacity,
      }}
    >
      <div
        className={`h-full w-full overflow-hidden border bg-[var(--color-board-card)] shadow-sm ${
          isSelected ? "ring-2 ring-[var(--color-accent)]" : ""
        }`}
        style={{ borderRadius: `${element.content.borderRadius}px` }}
      >
        {element.content.embedType === "link-card" ? (
          <a
            className="flex h-full items-center gap-4 p-4 no-underline"
            href={element.content.url}
            rel="noreferrer"
            target="_blank"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {element.content.faviconUrl ? (
              <img
                alt=""
                className="h-10 w-10 rounded-xl border bg-white"
                src={element.content.faviconUrl}
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                {element.content.title}
              </p>
              <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">
                {element.content.domain}
              </p>
            </div>
          </a>
        ) : (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            className="h-full w-full border-0"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            src={element.content.embedUrl}
            title={element.content.title}
          />
        )}
      </div>
    </div>
  );
}
