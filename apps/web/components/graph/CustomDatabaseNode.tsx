"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { Database } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { type GraphDatabaseNode } from "@/lib/graph-utils";

export const CustomDatabaseNode = memo(function CustomDatabaseNode({
  data,
  selected,
}: NodeProps<GraphDatabaseNode>) {
  const router = useRouter();
  const { openDatabaseModal } = useUIStore();

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
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
      onDoubleClick={handleOpen}
      className="group relative flex min-w-[88px] cursor-grab flex-col items-center gap-1.5 rounded-md px-1.5 py-1 text-center active:cursor-grabbing"
      title={`${data.title || "Untitled"} 열기`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-transparent opacity-0"
      />

      <div
        className={[
          "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all",
          selected
            ? "border-[#2E7D45] bg-[#2E7D45] shadow-[0_0_0_5px_rgba(46,125,69,0.16)]"
            : "border-[#2E7D45]/60 bg-[#2E7D45]/75 group-hover:border-[#2E7D45] group-hover:bg-[#2E7D45]",
        ].join(" ")}
      >
        <Database className="h-2 w-2 text-white" />
      </div>
      <div
        className={[
          "max-w-[132px] truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors",
          selected
            ? "bg-[#E8F5EC] text-[#246138] dark:bg-[#1A3327] dark:text-[#83d29b]"
            : "text-zinc-600 group-hover:bg-white/80 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-900/80 dark:group-hover:text-zinc-100",
        ].join(" ")}
      >
        {data.title || "Untitled"}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent opacity-0"
      />
    </div>
  );
});
