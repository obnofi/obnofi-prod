"use client";

import type { Task } from "@obnofi/types/database";
import { formatTaskDay, getStatusClasses } from "@/lib/task-view-utils";

interface ListViewProps {
  groveTasks: Task[];
  onOpenTask?: (task: Task) => void;
}

export function ListView({ groveTasks, onOpenTask }: ListViewProps) {
  return (
    <div className="flex h-full flex-col overflow-auto">
      {groveTasks.map((task) => (
        <article
          key={task.id}
          onClick={() => onOpenTask?.(task)}
          className="flex cursor-pointer items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 transition hover:bg-[var(--color-hover)]"
        >
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-[var(--color-text-primary)]">
              {task.name}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              {task.description ?? task.tags.join(", ")}
            </p>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {formatTaskDay(task.date)}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}>
            {task.status}
          </span>
        </article>
      ))}
    </div>
  );
}
