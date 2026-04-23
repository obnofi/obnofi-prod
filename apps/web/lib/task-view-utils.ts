import type { Task, TaskStatus } from "@obnofi/types/database";

export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Done"];

export function parseTaskDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function toTaskDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatTaskMonth(value: string): string {
  if (!value) {
    return "";
  }

  return parseTaskDate(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
}

export function formatTaskDay(value: string): string {
  if (!value) {
    return "";
  }

  return parseTaskDate(value).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
}

export function getTaskDurationInDays(task: Task): number {
  return differenceInDays(task.startDate, task.endDate) + 1;
}

export function differenceInDays(start: string, end: string): number {
  const startDate = parseTaskDate(start).getTime();
  const endDate = parseTaskDate(end).getTime();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.round((endDate - startDate) / millisecondsPerDay));
}

export function buildTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = {
    "To Do": [],
    "In Progress": [],
    "Done": [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return grouped;
}

export function buildTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const mapped = new Map<string, Task[]>();

  for (const task of tasks) {
    const bucket = mapped.get(task.date);
    if (bucket) {
      bucket.push(task);
      continue;
    }

    mapped.set(task.date, [task]);
  }

  return mapped;
}

export function getTimelineBounds(tasks: Task[]): { start: string; end: string } {
  const sorted = [...tasks].sort((left, right) =>
    left.startDate.localeCompare(right.startDate)
  );
  const timelineEnd = [...tasks].sort((left, right) =>
    left.endDate.localeCompare(right.endDate)
  );

  return {
    start: sorted[0]?.startDate ?? "",
    end: timelineEnd[timelineEnd.length - 1]?.endDate ?? "",
  };
}

export function getStatusClasses(status: TaskStatus): string {
  switch (status) {
    case "Done":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "In Progress":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "To Do":
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  }
}
