"use client";

import { Property, Page } from "@obnofi/types";
import { useDatabaseViewStore } from "@/store/useDatabaseViewStore";
import { useGroveTable } from "@/hooks/useGroveTable";
import { BoardView } from "@/components/database/views/BoardView";
import { CalendarView } from "@/components/database/views/CalendarView";
import { GalleryView } from "@/components/database/views/GalleryView";

interface DatabaseViewRendererProps {
  properties: Property[];
  rows: Page[];
}

export function DatabaseViewRenderer({
  properties,
  rows,
}: DatabaseViewRendererProps) {
  const activeView = useDatabaseViewStore((state) => state.activeView);
  const scopeId = `renderer:${properties[0]?.databaseId ?? "default"}`;
  const { table, queryState } = useGroveTable({
    scopeId,
    properties,
    rows,
  });

  switch (activeView) {
    case "board":
      return (
        <BoardView
          table={table}
          properties={properties}
          groupByPropertyId={queryState.grouping[0]}
        />
      );
    case "calendar":
      return <CalendarView table={table} properties={properties} />;
    case "gallery":
      return <GalleryView table={table} properties={properties} />;
    default:
      return null;
  }
}
