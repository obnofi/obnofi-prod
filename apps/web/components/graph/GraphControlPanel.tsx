"use client";

import { Panel } from "@xyflow/react";

interface GraphControlPanelProps {
  isLocalMode: boolean;
  localDepth: number;
  allNodesCount: number;
  onLocalModeToggle: () => void;
  onDepthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GraphControlPanel({
  isLocalMode,
  localDepth,
  allNodesCount,
  onLocalModeToggle,
  onDepthChange,
}: GraphControlPanelProps) {
  return (
    <Panel
      position="top-right"
      className="m-3 flex min-w-[240px] flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 shadow-sm backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[var(--color-text-primary)]">
          로컬 그래프
        </span>
        <button
          type="button"
          onClick={onLocalModeToggle}
          className="rounded-md px-2 py-1 text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
        >
          {isLocalMode ? "켜짐" : "꺼짐"}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          name="graph-depth"
          min={1}
          max={4}
          step={1}
          value={localDepth}
          onChange={onDepthChange}
          disabled={!isLocalMode}
          className="w-full accent-[var(--color-accent)] disabled:opacity-50"
        />
        <span className="w-6 text-xs text-[var(--color-text-secondary)]">
          {localDepth}
        </span>
      </div>
      <div className="text-[11px] text-[var(--color-text-secondary)]">
        {allNodesCount >= 500
          ? "Barnes-Hut 최적화 레이아웃입니다. 클릭으로 포커스, 더블클릭으로 페이지를 엽니다."
          : "클릭으로 포커스, 더블클릭으로 페이지를 엽니다."}
      </div>
    </Panel>
  );
}
