"use client";

import {
  Calendar,
  Clock3,
  GalleryHorizontal,
  LayoutGrid,
  List,
  Table,
} from "lucide-react";
import { useDatabaseViewStore } from "@/store/useDatabaseViewStore";
import type { ViewType } from "@obnofi/types/database";

const viewTabs: Array<{
  id: ViewType;
  label: string;
  icon: typeof Table;
}> = [
  { id: "table", label: "Table", icon: Table },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontal },
  { id: "list", label: "List", icon: List },
  { id: "timeline", label: "Timeline", icon: Clock3 },
];

export function DatabaseViewTabs() {
  const activeView = useDatabaseViewStore((state) => state.activeView);
  const setView = useDatabaseViewStore((state) => state.setView);

  return (
    <div className="border-b border-zinc-200">
      <div className="flex items-center gap-1 overflow-x-auto px-6">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3 py-3 text-[13px] font-medium transition-colors ${
              activeView === tab.id
                ? "border-b-2 border-[#111110] text-[#111110]"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
        <span className="ml-3 shrink-0 text-xs text-zinc-400">
          Same source, different views
        </span>
      </div>
    </div>
  );
}
