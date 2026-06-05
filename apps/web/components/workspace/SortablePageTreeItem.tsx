"use client";

import { useRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Plus, MoreHorizontal, FileText, Network, Palette, Database } from "lucide-react";
import { getUserColor } from "@/lib/collaborationUtils";
import { getUserInitials, PAGE_TREE_INDENT, type FlattenedPageNode } from "@/lib/sidebarPageTree";
import type { PageType } from "@obnofi/types";

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  mindmap: <Network className="w-4 h-4" />,
};

interface PageTreeItemProps {
  page: FlattenedPageNode;
  currentPageId?: string;
  activeAudience: Array<{ userId: string; userName: string }>;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  expanded: Set<string>;
  onOpenCreateMenu: (parentId: string | null, buttonEl: HTMLButtonElement) => void;
  onOpenMenu: (nodeId: string, buttonEl: HTMLButtonElement) => void;
  projectedDepth?: number;
  isDragging?: boolean;
}

export function SortablePageTreeItem({
  page,
  currentPageId,
  activeAudience,
  onSelect,
  onToggle,
  expanded,
  onOpenCreateMenu,
  onOpenMenu,
  projectedDepth,
  isDragging = false,
}: PageTreeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id });
  const isExpanded = expanded.has(page.id);
  const isActive = page.id === currentPageId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const depth = projectedDepth ?? page.depth;
  const visibleAudience = activeAudience.slice(0, 1);
  const extraAudienceCount = Math.max(0, activeAudience.length - visibleAudience.length);

  const handleOpenMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (buttonRef.current) onOpenMenu(page.id, buttonRef.current);
    },
    [page.id, onOpenMenu]
  );

  const handleOpenCreateMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (createButtonRef.current) onOpenCreateMenu(page.id, createButtonRef.current);
    },
    [page.id, onOpenCreateMenu]
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div
        {...attributes}
        {...listeners}
        data-testid={`sidebar-page-${page.id}`}
        className={`group flex items-center gap-1.5 py-1 rounded transition-colors ${
          isActive
            ? "bg-[var(--color-selected)] text-[var(--color-text-primary)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
        } ${isDragging ? "opacity-60" : ""}`}
        style={{ paddingLeft: `${depth * PAGE_TREE_INDENT + 8}px`, paddingRight: "8px" }}
        onClick={() => onSelect(page.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (page.hasChildren) onToggle(page.id);
          }}
          className={`p-0.5 rounded transition-transform shrink-0 ${
            page.hasChildren ? "opacity-100" : "opacity-0"
          } ${isExpanded ? "rotate-270" : ""}`}
        >
          <ChevronDown className="w-3 h-3 text-[var(--color-text-secondary)]" />
        </button>
        <span className="text-[var(--color-text-secondary)] shrink-0">
          {page.icon || typeIcons[page.type]}
        </span>
        <span className="flex-1 text-[13px] truncate">{page.title || "Untitled"}</span>

        {activeAudience.length > 0 ? (
          <div className="flex items-center gap-1">
            {visibleAudience.map((user) => (
              <span
                key={user.userId}
                data-testid={`user-avatar-${user.userId}`}
                title={user.userName}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: getUserColor(user.userId) }}
              >
                {getUserInitials(user.userName)}
              </span>
            ))}
            {extraAudienceCount > 0 ? (
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                +{extraAudienceCount}
              </span>
            ) : null}
          </div>
        ) : null}

        <button
          ref={createButtonRef}
          onClick={handleOpenCreateMenu}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--color-hover)] transition-all"
          title="하위 항목 추가"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
        </button>
        <button
          ref={buttonRef}
          onClick={handleOpenMenu}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--color-hover)] transition-all"
          title="더보기"
        >
          <MoreHorizontal className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}
