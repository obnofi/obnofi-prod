"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface GraphViewHeaderProps {
  workspaceId: string;
  queryPageId: string | null;
  nodeCount: number;
  edgeCount: number;
}

export function GraphViewHeader({
  workspaceId,
  queryPageId,
  nodeCount,
  edgeCount,
}: GraphViewHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-5 py-3">
      <div className="flex items-center gap-3">
        <Link
          href={`/workspace/${workspaceId}${queryPageId ? `?page=${queryPageId}` : ""}`}
          data-testid="graph-back-link"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="워크스페이스로 돌아가기"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Graph View
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {nodeCount}개 노드, {edgeCount}개 링크
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
