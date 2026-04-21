"use client";

import {
  CalendarDays,
  GalleryHorizontal,
  KanbanSquare,
  LayoutList,
  Table2,
  Timer,
  Plus,
} from "lucide-react";
import { useDatabaseViewStore } from "@/store/useDatabaseViewStore";
import type { ViewType } from "@/types/database";

const groveViewTabs: Array<{
  id: ViewType;
  label: string;
  icon: typeof Table2;
}> = [
  { id: "table", label: "Table", icon: Table2 },
  { id: "board", label: "Board", icon: KanbanSquare },
  { id: "list", label: "List", icon: LayoutList },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontal },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "timeline", label: "Timeline", icon: Timer },
];

export function ViewTabs({ onCreateTask }: { onCreateTask?: () => void }) {
  const activeView = useDatabaseViewStore((state) => state.activeView);
  const setActiveView = useDatabaseViewStore((state) => state.setActiveView);

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--color-border)] px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {groveViewTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
      </div>
      <button
        type="button"
        onClick={() => onCreateTask?.()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
      >
        <Plus className="h-3.5 w-3.5" />
        추가
      </button>
    </div>
  );
}
