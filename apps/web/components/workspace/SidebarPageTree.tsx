"use client";

import Link from "next/link";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Clock, Trees } from "lucide-react";
import type { SensorDescriptor, SensorOptions, DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { PageTreeSkeleton, RecentSkeleton } from "@/components/workspace/SidebarSkeletons";
import { SortablePageTreeItem } from "@/components/workspace/SortablePageTreeItem";
import type { FlattenedPageNode, ProjectedDrop } from "@/lib/sidebarPageTree";
import type { Page } from "@obnofi/types";

interface SidebarPageTreeProps {
  workspaceId: string;
  showPageTreeSkeleton: boolean;
  visiblePageTreeItems: FlattenedPageNode[];
  effectiveCurrentPageId?: string;
  pageAudienceById: Map<string, Array<{ userId: string; userName: string }>>;
  expandedPages: Set<string>;
  activeDragPageId: string | null;
  projectedDrop: ProjectedDrop | null;
  recentPages: Page[];
  sensors: Array<SensorDescriptor<SensorOptions>>;
  filesCreateButtonRef: React.RefObject<HTMLButtonElement>;
  onToggleExpand: (pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onOpenCreateMenu: (parentId: string | null, buttonEl: HTMLButtonElement) => void;
  onOpenMenu: (nodeId: string, buttonEl: HTMLButtonElement) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragMove: (event: DragMoveEvent) => void;
  onDragEnd: (event: DragEndEvent) => Promise<void>;
  onDragCancel: () => void;
}

export function SidebarPageTree({
  showPageTreeSkeleton,
  visiblePageTreeItems,
  effectiveCurrentPageId,
  pageAudienceById,
  expandedPages,
  activeDragPageId,
  projectedDrop,
  recentPages,
  sensors,
  filesCreateButtonRef,
  onToggleExpand,
  onSelectPage,
  onOpenCreateMenu,
  onOpenMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: SidebarPageTreeProps) {
  return (
    <>
      {/* Files - Page Tree */}
      <div className="px-2 mt-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">
            Files
          </span>
          <button
            ref={filesCreateButtonRef}
            onClick={(e) => onOpenCreateMenu(null, e.currentTarget)}
            className="p-0.5 rounded hover:bg-[var(--color-hover)]"
            title="페이지 추가"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--color-text-placeholder)]" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {showPageTreeSkeleton ? (
            <PageTreeSkeleton />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={(event) => void onDragEnd(event)}
              onDragCancel={onDragCancel}
            >
              <SortableContext
                items={visiblePageTreeItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {visiblePageTreeItems.map((item) => (
                  <SortablePageTreeItem
                    key={item.id}
                    page={item}
                    currentPageId={effectiveCurrentPageId}
                    activeAudience={pageAudienceById.get(item.id) ?? []}
                    onSelect={onSelectPage}
                    onToggle={onToggleExpand}
                    expanded={expandedPages}
                    onOpenCreateMenu={onOpenCreateMenu}
                    onOpenMenu={onOpenMenu}
                    projectedDepth={
                      item.id === activeDragPageId && projectedDrop
                        ? projectedDrop.depth
                        : undefined
                    }
                    isDragging={item.id === activeDragPageId}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Recent */}
      {showPageTreeSkeleton ? (
        <div className="border-t border-[var(--color-border)] px-2 py-2 shrink-0">
          <div className="px-2 py-1 text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">
            Recent
          </div>
          <RecentSkeleton />
        </div>
      ) : recentPages.length > 0 ? (
        <div className="border-t border-[var(--color-border)] px-2 py-2 shrink-0">
          <div className="px-2 py-1 text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">
            Recent
          </div>
          <div className="flex flex-col gap-0.5">
            {recentPages.map((page) => (
              <button
                key={page.id}
                onClick={() => onSelectPage(page.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
              >
                <Clock className="w-3.5 h-3.5" />
                {page.title || "Untitled"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-t border-[var(--color-border)] px-2 py-2 shrink-0">
        <div className="px-2 py-1 text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">
          Community
        </div>
        <div className="flex flex-col gap-0.5">
          <Link
            href="/forest"
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
          >
            <Trees className="w-3.5 h-3.5" />
            Forest
          </Link>
        </div>
      </div>
    </>
  );
}
