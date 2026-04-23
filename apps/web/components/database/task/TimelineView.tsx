"use client";

import type { Task } from "@obnofi/types/database";
import {
  differenceInDays,
  formatTaskDay,
  getStatusClasses,
  getTimelineBounds,
} from "@/lib/task-view-utils";

interface TimelineViewProps {
  groveTasks: Task[];
  onOpenTask?: (task: Task) => void;
}

export function TimelineView({ groveTasks, onOpenTask }: TimelineViewProps) {
  const bounds = getTimelineBounds(groveTasks);
  const totalDays = Math.max(1, differenceInDays(bounds.start, bounds.end) + 1);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>{formatTaskDay(bounds.start)}</span>
        <span>{totalDays} days</span>
        <span>{formatTaskDay(bounds.end)}</span>
      </div>
      <div className="space-y-3">
        {groveTasks.map((task) => {
          const startOffset = differenceInDays(bounds.start, task.startDate);
          const duration = differenceInDays(task.startDate, task.endDate) + 1;
          const left = (startOffset / totalDays) * 100;
          const width = Math.max((duration / totalDays) * 100, 4);

          return (
            <div
              key={task.id}
              onClick={() => onOpenTask?.(task)}
              className="grid cursor-pointer grid-cols-[180px_1fr] items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-[var(--color-hover)]"
            >
              <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {task.name}
              </div>
              <div className="relative h-9 rounded-full bg-[var(--color-hover)]">
                <div
                  className={`absolute top-1 flex h-7 items-center rounded-full px-3 text-xs font-medium ${getStatusClasses(task.status)}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <span className="truncate">
                    {formatTaskDay(task.startDate)} - {formatTaskDay(task.endDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
