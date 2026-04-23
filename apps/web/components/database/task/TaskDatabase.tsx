"use client";

import { useEffect, useState } from "react";
import type { Task } from "@obnofi/types/database";
import { useDatabaseViewStore } from "@/store/useDatabaseViewStore";
import { useUIStore } from "@/store/useUIStore";
import { ViewTabs } from "@/components/database/task/ViewTabs";
import { TableView } from "@/components/database/task/TableView";
import { BoardView } from "@/components/database/task/BoardView";
import { ListView } from "@/components/database/task/ListView";
import { GalleryView } from "@/components/database/task/GalleryView";
import { CalendarView } from "@/components/database/task/CalendarView";
import { TimelineView } from "@/components/database/task/TimelineView";

interface TaskDatabaseProps {
  groveTasks: Task[];
}

export function TaskDatabase({ groveTasks }: TaskDatabaseProps) {
  const activeView = useDatabaseViewStore((state) => state.activeView);
  const openGroveTaskSideTab = useUIStore((state) => state.openGroveTaskSideTab);
  const [localTasks, setLocalTasks] = useState(groveTasks);

  useEffect(() => {
    setLocalTasks(groveTasks);
  }, [groveTasks]);

  const handleOpenTask = (task: Task) => {
    openGroveTaskSideTab(task);
  };

  const handlePlantTask = (dateKey?: string) => {
    const now = new Date();
    const fallbackDate = now.toISOString().slice(0, 10);
    const plantedTask: Task = {
      id: `task-${now.getTime()}`,
      name: "새 Task",
      status: "To Do",
      tags: [],
      date: dateKey ?? fallbackDate,
      startDate: dateKey ?? fallbackDate,
      endDate: dateKey ?? fallbackDate,
      description: "",
    };

    setLocalTasks((current) => [...current, plantedTask]);
    openGroveTaskSideTab(plantedTask);
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
      <ViewTabs onCreateTask={() => handlePlantTask()} />
      <div className="min-h-0 flex-1">
        {activeView === "table" ? (
          <TableView groveTasks={localTasks} onOpenTask={handleOpenTask} />
        ) : null}
        {activeView === "board" ? (
          <BoardView groveTasks={localTasks} onOpenTask={handleOpenTask} />
        ) : null}
        {activeView === "list" ? (
          <ListView groveTasks={localTasks} onOpenTask={handleOpenTask} />
        ) : null}
        {activeView === "gallery" ? (
          <GalleryView groveTasks={localTasks} onOpenTask={handleOpenTask} />
        ) : null}
        {activeView === "calendar" ? (
          <CalendarView
            groveTasks={localTasks}
            onOpenTask={handleOpenTask}
            onCreateTask={handlePlantTask}
          />
        ) : null}
        {activeView === "timeline" ? (
          <TimelineView groveTasks={localTasks} onOpenTask={handleOpenTask} />
        ) : null}
      </div>
    </section>
  );
}
