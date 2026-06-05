"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";

export type MindGroveNodeData = {
  label: string;
  color?: string;
};

const NODE_COLORS = [
  { id: "default", bg: "var(--color-accent)", text: "#fff" },
  { id: "sky", bg: "#3b82f6", text: "#fff" },
  { id: "green", bg: "#22c55e", text: "#1a1a1a" },
  { id: "rose", bg: "#f43f5e", text: "#fff" },
  { id: "amber", bg: "#f59e0b", text: "#1a1a1a" },
  { id: "violet", bg: "#8b5cf6", text: "#fff" },
];

const handleClass = "!w-2.5 !h-2.5 !bg-[var(--color-surface)] !border-[var(--color-border)] hover:!bg-[var(--color-accent)] transition-colors";

export const MindGroveNode = memo(function MindGroveNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const nodeData = data as MindGroveNodeData;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nodeData.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const colorEntry = NODE_COLORS.find((c) => c.id === (nodeData.color ?? "default")) ?? NODE_COLORS[0];

  useEffect(() => {
    if (editing) {
      setDraft(nodeData.label);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, nodeData.label]);

  const commitEdit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed) updateNodeData(id, { label: trimmed });
    setEditing(false);
  }, [draft, id, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter") commitEdit();
      if (e.key === "Escape") {
        setDraft(nodeData.label);
        setEditing(false);
      }
    },
    [commitEdit, nodeData.label]
  );

  return (
    <div className="relative group/node">
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Handle type="target" position={Position.Top} className={handleClass} />

      {/* Color palette — visible when selected */}
      {selected && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-1.5 shadow-lg z-50 nodrag">
          {NODE_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(id, { color: c.id });
              }}
              className="w-4 h-4 rounded-full transition-transform hover:scale-125 focus:outline-none"
              style={{
                backgroundColor: c.bg,
                boxShadow: (nodeData.color ?? "default") === c.id ? `0 0 0 2px var(--color-surface), 0 0 0 3.5px ${c.bg}` : "none",
              }}
            />
          ))}
        </div>
      )}

      <div
        className={`min-w-[80px] max-w-[240px] rounded-xl px-3 py-2 text-sm font-medium shadow-md transition-all duration-100 select-none cursor-default ${
          selected ? "ring-2 ring-offset-1 ring-[var(--color-accent)] ring-offset-[var(--color-background)]" : ""
        }`}
        style={{ backgroundColor: colorEntry.bg, color: colorEntry.text }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none w-full min-w-[60px]"
            style={{ color: colorEntry.text }}
          />
        ) : (
          <span className="whitespace-pre-wrap break-words leading-snug">{nodeData.label}</span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className={handleClass} />
      <Handle type="source" position={Position.Bottom} className={handleClass} />
    </div>
  );
});
