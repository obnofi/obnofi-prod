"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Database,
  GripVertical,
  MoreHorizontal,
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { type GraphDatabaseNode } from "@/lib/graph-utils";

export const CustomDatabaseNode = memo(function CustomDatabaseNode({
  data,
  selected,
}: NodeProps<GraphDatabaseNode>) {
  const router = useRouter();
  const { openDatabaseModal } = useUIStore();

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    router.push(data.path);
  };

  const handleOpenDatabaseModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (data.databaseId) {
      openDatabaseModal(data.databaseId, data.title);
    }
  };

  return (
    <div
      className={`group relative min-w-[200px] rounded-xl border bg-white/95 px-4 py-3 shadow-sm backdrop-blur transition-all dark:bg-zinc-800/95 ${
        selected
          ? "border-[#2E7D45] shadow-[0_0_0_3px_rgba(46,125,69,0.14)]"
          : "border-zinc-200 hover:border-[#2E7D45] hover:shadow-md dark:border-zinc-700 dark:hover:border-[#2E7D45]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-0 !bg-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="flex items-start gap-3">
        <div className="drag-handle mt-0.5 cursor-grab rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing dark:hover:bg-zinc-700 dark:hover:text-zinc-200">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 flex-shrink-0 text-[#2E7D45]" />
            <span className="truncate text-sm font-medium text-[#111110] dark:text-zinc-100">
              {data.title || "Untitled"}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Click &quot;...&quot; to view database
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleOpenDatabaseModal}
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-[#2E7D45] dark:hover:bg-zinc-700 dark:hover:text-[#2E7D45]"
            aria-label={`Open database view for ${data.title || "page"}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            aria-label={`Open ${data.title || "page"}`}
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-0 !bg-[#2E7D45] opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
});
