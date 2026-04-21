"use client";

import { Plus } from "lucide-react";
import type { Task } from "@/types/database";
import {
  buildTasksByDate,
  formatTaskMonth,
  parseTaskDate,
  toTaskDateKey,
} from "@/lib/task-view-utils";

interface CalendarViewProps {
  groveTasks: Task[];
  onOpenTask?: (task: Task) => void;
  onCreateTask?: (dateKey: string) => void;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({
  groveTasks,
  onOpenTask,
  onCreateTask,
}: CalendarViewProps) {
  const anchorDate = groveTasks[0]?.date ?? toTaskDateKey(new Date());
  const anchor = parseTaskDate(anchorDate);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const groveTasksByDate = buildTasksByDate(groveTasks);

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const day = index - firstDay + 1;
    if (day < 1 || day > daysInMonth) {
      return null;
    }

    return {
      day,
      dateKey: toTaskDateKey(new Date(year, month, day)),
    };
  });

  return (
    <div className="h-full overflow-auto p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
        {formatTaskMonth(anchorDate)}
      </h3>
      <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
        {weekdays.map((weekday) => (
          <div
            key={weekday}
            className="py-2 text-center text-[11px] font-medium text-[var(--color-text-secondary)]"
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => (
          <div
            key={cell?.dateKey ?? `empty-${index}`}
            className="group min-h-[92px] border-b border-r border-[var(--color-border)] p-2 [&:nth-child(7n)]:border-r-0"
          >
            {cell ? (
              <>
                <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <span>{cell.day}</span>
                  <button
                    type="button"
                    onClick={() => onCreateTask?.(cell.dateKey)}
                    className="hidden h-6 w-6 items-center justify-center rounded-md transition hover:bg-[var(--color-hover)] hover:text-[var(--color-accent)] group-hover:flex"
                    aria-label={`${cell.dateKey} task 추가`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {(groveTasksByDate.get(cell.dateKey) ?? []).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTask?.(task)}
                      className="cursor-pointer truncate rounded bg-[var(--color-accent-subtle)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-accent)] transition hover:brightness-95"
                    >
                      {task.name}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
