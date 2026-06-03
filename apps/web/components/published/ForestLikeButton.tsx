"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";

interface ForestLikeButtonProps {
  publishId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  compact?: boolean;
}

export function ForestLikeButton({
  publishId,
  initialLiked,
  initialLikeCount,
  compact = false,
}: ForestLikeButtonProps) {
  const router = useRouter();
  const [viewerHasLiked, setViewerHasLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch(`/api/published-pages/${publishId}/like`, {
        method: viewerHasLiked ? "DELETE" : "POST",
      });

      if (response.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      const next = await response.json() as { viewerHasLiked: boolean; likeCount: number };
      setViewerHasLiked(next.viewerHasLiked);
      setLikeCount(next.likeCount);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition ${
        viewerHasLiked
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
      }`}
      aria-label={viewerHasLiked ? "북마크 해제" : "북마크"}
    >
      <Bookmark className={`h-3.5 w-3.5 ${viewerHasLiked ? "fill-current" : ""}`} />
      <span>{compact ? likeCount : `Save ${likeCount}`}</span>
    </button>
  );
}
