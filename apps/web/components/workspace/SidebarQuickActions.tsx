"use client";

import Link from "next/link";
import { Search, Settings, Plus, Orbit } from "lucide-react";
import { ImportFromUrlControl } from "@/components/workspace/ImportFromUrlControl";
import { AntGlyph } from "@/components/icons/AntGlyph";
import { typeIcons } from "@/components/workspace/sidebarConstants";
import { creatablePageTypes, creatablePageLabels } from "@/lib/pageCreation";
import type { PageType } from "@obnofi/types";

interface SidebarQuickActionsProps {
  workspaceId: string;
  currentPageId?: string;
  showNewPageMenu: boolean;
  onToggleNewPageMenu: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onCreatePage: (type: PageType) => void;
  onCloseNewPageMenu: () => void;
}

export function SidebarQuickActions({
  workspaceId,
  currentPageId,
  showNewPageMenu,
  onToggleNewPageMenu,
  onOpenSearch,
  onOpenSettings,
  onCreatePage,
  onCloseNewPageMenu,
}: SidebarQuickActionsProps) {
  return (
    <div className="px-2 flex flex-col gap-0.5">
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
      >
        <Search className="w-4 h-4" />Search
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
      >
        <Settings className="w-4 h-4" />Settings
      </button>
      <ImportFromUrlControl
        workspaceId={workspaceId}
        onClose={onCloseNewPageMenu}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
        label="Crawler"
        icon={<AntGlyph className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />}
      />
      <div className="relative">
        <button
          onClick={onToggleNewPageMenu}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px] w-full text-left"
        >
          <Plus className="w-4 h-4" />New page
        </button>
        {showNewPageMenu && (
          <div className="absolute top-full left-0 right-0 z-[99999] mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
            {creatablePageTypes.map((type) => (
              <button
                key={type}
                onClick={() => onCreatePage(type)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition-colors"
              >
                {typeIcons[type]}
                <span>{creatablePageLabels[type]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Link
        href={`/workspace/${workspaceId}/graph${currentPageId ? `?page=${currentPageId}` : ""}`}
        data-testid="graph-view-link"
        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
      >
        <Orbit className="w-4 h-4" />Graph View
      </Link>
    </div>
  );
}
