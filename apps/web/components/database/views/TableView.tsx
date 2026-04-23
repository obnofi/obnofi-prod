"use client";

import type { Task } from "@obnofi/types/database";
import { formatTaskDay, getStatusClasses } from "@/lib/task-view-utils";

interface TaskTableViewProps {
  tasks: Task[];
}

export function TaskTableView({ tasks }: TaskTableViewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-[var(--color-surface)]">
            <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              <th className="border-b border-[var(--color-border)] px-4 py-3 font-medium">Task</th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 font-medium">Status</th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 font-medium">Tags</th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 font-medium">Date</th>
              <th className="border-b border-[var(--color-border)] px-4 py-3 font-medium">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="text-[var(--color-text-primary)]">
                <td className="border-b border-[var(--color-border)] px-4 py-3 font-medium text-[var(--color-text-primary)]">
                  {task.name}
                </td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--color-hover)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-secondary)]">
                  {formatTaskDay(task.date)}
                </td>
                <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-secondary)]">
                  {formatTaskDay(task.startDate)} - {formatTaskDay(task.endDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
