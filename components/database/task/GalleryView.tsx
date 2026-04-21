"use client";

import { ImageIcon } from "lucide-react";
import type { Task } from "@/types/database";
import { formatTaskDay, getStatusClasses } from "@/lib/task-view-utils";

interface GalleryViewProps {
  groveTasks: Task[];
  onOpenTask?: (task: Task) => void;
}

export function GalleryView({ groveTasks, onOpenTask }: GalleryViewProps) {
  return (
    <div className="grid h-full content-start gap-4 overflow-auto p-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {groveTasks.map((task) => (
        <article
          key={task.id}
          onClick={() => onOpenTask?.(task)}
          className="cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] transition hover:border-[var(--color-accent)]"
        >
          <div className="flex h-32 items-center justify-center overflow-hidden bg-[var(--color-surface)]">
            {task.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.coverUrl}
                alt={task.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-[var(--color-text-placeholder)]" />
            )}
          </div>
          <div className="space-y-3 p-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {task.name}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {formatTaskDay(task.date)}
              </p>
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}>
              {task.status}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
