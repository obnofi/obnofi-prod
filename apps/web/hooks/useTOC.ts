"use client";

import { useEffect, useMemo, useState } from "react";

export interface TOCHeading {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

interface UseTOCResult {
  activeHeadingId: string | null;
  headings: TOCHeading[];
}

const HEADING_SELECTOR = "h1, h2, h3";

function slugifyHeading(text: string) {
  const slug = text
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "section";
}

function getHeadingLevel(element: Element): 1 | 2 | 3 | null {
  if (element.tagName === "H1") return 1;
  if (element.tagName === "H2") return 2;
  if (element.tagName === "H3") return 3;
  return null;
}

function getScrollParent(element: HTMLElement | null) {
  if (!element) {
    return null;
  }

  let current = element.parentElement;

  while (current) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function useTOC(container: HTMLElement | null): UseTOCResult {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!container) {
      setHeadings([]);
      setActiveHeadingId(null);
      return;
    }

    const collectHeadings = () => {
      const headingElements = Array.from(
        container.querySelectorAll<HTMLElement>(HEADING_SELECTOR)
      );

      const idCounts = new Map<string, number>();
      const nextHeadings: TOCHeading[] = headingElements.flatMap((element) => {
        const level = getHeadingLevel(element);
        const text = element.textContent?.trim() ?? "";

        if (!level || !text) {
          return [];
        }

        if (!element.id) {
          const baseId = slugifyHeading(text);
          const duplicateCount = idCounts.get(baseId) ?? 0;
          const nextId = duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount + 1}`;
          idCounts.set(baseId, duplicateCount + 1);
          element.id = nextId;
        }

        return [{ id: element.id, level, text }];
      });

      setHeadings(nextHeadings);
      setActiveHeadingId((currentId) => {
        if (nextHeadings.length === 0) {
          return null;
        }

        return nextHeadings.some((heading) => heading.id === currentId)
          ? currentId
          : nextHeadings[0].id;
      });
    };

    collectHeadings();

    const mutationObserver = new MutationObserver(() => {
      collectHeadings();
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [container]);

  useEffect(() => {
    if (!container || headings.length === 0) {
      setActiveHeadingId(null);
      return;
    }

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (headingElements.length === 0) {
      setActiveHeadingId(null);
      return;
    }

    const scrollParent = getScrollParent(container);
    const root = scrollParent ?? null;

    const updateActiveHeading = () => {
      const rootTop = root?.getBoundingClientRect().top ?? 0;
      const threshold = rootTop + 120;

      let nextActiveId = headingElements[0]?.id ?? null;

      for (const element of headingElements) {
        if (element.getBoundingClientRect().top <= threshold) {
          nextActiveId = element.id;
        } else {
          break;
        }
      }

      setActiveHeadingId(nextActiveId);
    };

    updateActiveHeading();

    const intersectionObserver = new IntersectionObserver(
      () => {
        updateActiveHeading();
      },
      {
        root,
        rootMargin: "-96px 0px -65% 0px",
        threshold: [0, 1],
      }
    );

    headingElements.forEach((element) => {
      intersectionObserver.observe(element);
    });

    return () => {
      intersectionObserver.disconnect();
    };
  }, [container, headings]);

  return useMemo(
    () => ({
      activeHeadingId,
      headings,
    }),
    [activeHeadingId, headings]
  );
}
