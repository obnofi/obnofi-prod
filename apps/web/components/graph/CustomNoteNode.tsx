"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { type GraphNode } from "@/lib/graph-utils";

export const CustomNoteNode = memo(function CustomNoteNode({
  data,
  selected,
}: NodeProps<GraphNode>) {
  const router = useRouter();

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    router.push(data.path);
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
          "h-3.5 w-3.5 rounded-full border transition-all",
          selected
            ? "border-[#2E7D45] bg-[#2E7D45] shadow-[0_0_0_5px_rgba(46,125,69,0.16)]"
            : "border-slate-400/60 bg-slate-500/75 group-hover:border-[#2E7D45] group-hover:bg-[#2E7D45]",
        ].join(" ")}
      />
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
