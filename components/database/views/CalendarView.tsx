"use client";

import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { Table } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Page, Property } from "@/types";
import { getPropertyValueData } from "@/hooks/useGroveTable";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

interface CalendarViewProps {
  table: Table<Page>;
  properties: Property[];
  onCreateRow?: () => void;
  onOpenRow?: (rowId: string) => void;
}

export function CalendarView({
  table,
  properties,
  onCreateRow,
  onOpenRow,
}: CalendarViewProps) {
  const dateProperty = properties.find((property) => property.type === "date");

  if (!dateProperty) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-[var(--color-text-secondary)]">
        <p className="text-sm">Calendar view needs a date field mapping.</p>
        <button
          type="button"
          onClick={onCreateRow}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Plant Seed
        </button>
      </div>
    );
  }

  const events = table.getPreGroupedRowModel().rows.flatMap((rowModel) => {
    const row = rowModel.original;
    const value = getPropertyValueData(row, dateProperty.id);
    if (!value || value.type !== "date" || !value.value) {
      return [];
    }

    return [
      {
        id: row.id,
        title: row.title || "Untitled",
        start: value.value,
        end: value.endValue ?? undefined,
        allDay: !value.includeTime,
      },
    ];
  });

  return (
    <div className="h-full overflow-auto p-4">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          height="auto"
          events={events}
          eventClick={(info) => onOpenRow?.(info.event.id)}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
        />
      </div>
    </div>
  );
}
