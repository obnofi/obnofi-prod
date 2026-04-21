"use client";

import type { Task, TaskStatus } from "@/types/database";
import {
  TASK_STATUSES,
  buildTasksByStatus,
  formatTaskDay,
  getStatusClasses,
} from "@/lib/task-view-utils";

interface BoardViewProps {
  groveTasks: Task[];
  onOpenTask?: (task: Task) => void;
}

export function BoardView({ groveTasks, onOpenTask }: BoardViewProps) {
  const groveTasksByStatus = buildTasksByStatus(groveTasks);

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4">
      {TASK_STATUSES.map((status: TaskStatus) => (
        <section
          key={status}
          className="flex min-w-[260px] flex-1 flex-col rounded-xl bg-[var(--color-surface)] p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
              {status}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {groveTasksByStatus[status].length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {groveTasksByStatus[status].map((task) => (
              <article
                key={task.id}
                onClick={() => onOpenTask?.(task)}
                className="cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-sm transition hover:border-[var(--color-accent)]"
              >
                <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                  {task.name}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {formatTaskDay(task.date)}
                </p>
                {task.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
