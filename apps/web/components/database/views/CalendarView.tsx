"use client";

import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { Table } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Page, Property } from "@obnofi/types";
import { getPropertyValueData } from "@/hooks/useGroveTable";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

interface CalendarViewProps {
  table: Table<Page>;
  properties: Property[];
  onCreateRow?: (dateKey?: string) => void | Promise<void>;
  onOpenRow?: (rowId: string) => void;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
          onClick={() => void onCreateRow?.()}
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
      <div className="grove-calendar overflow-hidden bg-[var(--color-background)] p-3">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          height="auto"
          fixedWeekCount={false}
          showNonCurrentDates={false}
          events={events}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            onOpenRow?.(info.event.id);
          }}
          eventContent={(eventInfo) => (
            <div className="min-w-0 truncate px-1.5 py-0.5">
              {eventInfo.event.title}
            </div>
          )}
          dayCellContent={(dayInfo) => (
            <div className="group flex min-h-6 items-start justify-between gap-1">
              <span>{dayInfo.dayNumberText}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void onCreateRow?.(toDateKey(dayInfo.date));
                }}
                className="hidden h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-accent)] group-hover:flex"
                aria-label={`${toDateKey(dayInfo.date)} 페이지 추가`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          dayHeaderFormat={{ weekday: "short" }}
          headerToolbar={{
            left: "title",
            center: "",
            right: "prev,next today",
          }}
          buttonText={{
            today: "Today",
          }}
        />
      </div>
    </div>
  );
}
