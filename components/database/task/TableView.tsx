"use client";

import type { Task } from "@/types/database";
import { formatTaskDay, getStatusClasses } from "@/lib/task-view-utils";

interface TableViewProps {
  groveTasks: Task[];
  onOpenTask?: (task: Task) => void;
}

export function TableView({ groveTasks, onOpenTask }: TableViewProps) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Tags</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Range</th>
          </tr>
        </thead>
        <tbody>
          {groveTasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onOpenTask?.(task)}
              className="border-b border-[var(--color-border)] text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)]"
            >
              <td className="px-4 py-3 font-medium">{task.name}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}>
                  {task.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {formatTaskDay(task.date)}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {formatTaskDay(task.startDate)} - {formatTaskDay(task.endDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
