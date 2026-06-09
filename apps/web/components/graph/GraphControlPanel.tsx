"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "@xyflow/react";
import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useGraphStore,
  type GraphForceSettings,
  type GraphLabelMode,
} from "@/components/graph/graphStore";

interface GraphControlPanelProps {
  allNodesCount: number;
}

interface ForceRow {
  key: keyof GraphForceSettings;
  label: string;
  min: number;
  max: number;
  step: number;
}

const FORCE_ROWS: ForceRow[] = [
  { key: "repelStrength", label: "반발력", min: 80, max: 1200, step: 20 },
  { key: "linkDistance", label: "링크 거리", min: 30, max: 240, step: 2 },
  { key: "linkStrength", label: "링크 강도", min: 0, max: 1, step: 0.02 },
  { key: "centerGravity", label: "중심 중력", min: 0, max: 0.6, step: 0.01 },
];

const LABEL_MODES: { value: GraphLabelMode; label: string }[] = [
  { value: "auto", label: "자동" },
  { value: "always", label: "항상" },
  { value: "hidden", label: "숨김" },
];

const LEGEND_ITEMS: { color: string; label: string }[] = [
  { color: "var(--color-graph-document)", label: "문서" },
  { color: "var(--color-graph-canvas)", label: "캔버스" },
  { color: "var(--color-graph-database)", label: "데이터베이스" },
  { color: "var(--color-graph-mindmap)", label: "마인드맵" },
  { color: "var(--color-graph-unresolved)", label: "미해결 링크" },
  { color: "var(--color-accent)", label: "현재 · 고정 · 검색" },
];

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[var(--color-border)] pt-2 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
      >
        {title}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open ? <div className="mt-2 flex flex-col gap-2.5">{children}</div> : null}
    </div>
  );
}

export function GraphControlPanel({ allNodesCount }: GraphControlPanelProps) {
  const isLocalMode = useGraphStore((state) => state.isLocalMode);
  const localDepth = useGraphStore((state) => state.localDepth);
  const setLocalMode = useGraphStore((state) => state.setLocalMode);
  const setLocalDepth = useGraphStore((state) => state.setLocalDepth);

  const searchQuery = useGraphStore((state) => state.searchQuery);
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery);
  const showOrphans = useGraphStore((state) => state.showOrphans);
  const setShowOrphans = useGraphStore((state) => state.setShowOrphans);
  const showArrows = useGraphStore((state) => state.showArrows);
  const setShowArrows = useGraphStore((state) => state.setShowArrows);
  const labelMode = useGraphStore((state) => state.labelMode);
  const setLabelMode = useGraphStore((state) => state.setLabelMode);
  const forces = useGraphStore((state) => state.forces);
  const setForce = useGraphStore((state) => state.setForce);
  const resetForces = useGraphStore((state) => state.resetForces);

  const [collapsed, setCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wantSearchFocusRef = useRef(false);

  // "/" 단축키로 검색창 포커스 (입력 중이 아닐 때만).
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      wantSearchFocusRef.current = true;
      setCollapsed(false);
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!collapsed && wantSearchFocusRef.current) {
      searchInputRef.current?.focus();
      wantSearchFocusRef.current = false;
    }
  }, [collapsed]);

  if (collapsed) {
    return (
      <Panel position="top-right" className="m-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="그래프 설정 열기"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 text-[var(--color-text-secondary)] shadow-sm backdrop-blur transition hover:text-[var(--color-text-primary)]"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </Panel>
    );
  }

  return (
    <Panel
      position="top-right"
      className="m-3 flex max-h-[calc(100vh-120px)] w-[260px] flex-col gap-3 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 shadow-sm backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          그래프 설정
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="그래프 설정 닫기"
          className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Section title="검색 · 필터">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-placeholder)]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="노드 검색…"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] py-1.5 pl-7 pr-7 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="검색어 지우기"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <ToggleRow
          label="고아 노드 표시"
          checked={showOrphans}
          onChange={setShowOrphans}
        />
      </Section>

      <Section title="로컬 그래프">
        <ToggleRow
          label="현재 노드 주변만"
          checked={isLocalMode}
          onChange={setLocalMode}
        />
        <div className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-[11px] text-[var(--color-text-secondary)]">
            깊이 {localDepth}
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={localDepth}
            onChange={(event) => setLocalDepth(Number(event.target.value))}
            disabled={!isLocalMode}
            className="w-full accent-[var(--color-accent)] disabled:opacity-40"
          />
        </div>
      </Section>

      <Section title="표시">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-[var(--color-text-secondary)]">라벨</span>
          <div className="flex overflow-hidden rounded-md border border-[var(--color-border)]">
            {LABEL_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setLabelMode(mode.value)}
                className={`px-2 py-1 text-[11px] transition ${
                  labelMode === mode.value
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow
          label="방향 화살표"
          checked={showArrows}
          onChange={setShowArrows}
        />
      </Section>

      <Section title="힘" defaultOpen={false}>
        {FORCE_ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-[11px] text-[var(--color-text-secondary)]">
              {row.label}
            </span>
            <input
              type="range"
              min={row.min}
              max={row.max}
              step={row.step}
              value={forces[row.key]}
              onChange={(event) =>
                setForce(row.key, Number(event.target.value))
              }
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={resetForces}
          className="mt-0.5 flex items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] py-1.5 text-[11px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
        >
          <RotateCcw className="h-3 w-3" />
          힘 초기화
        </button>
      </Section>

      <Section title="범례" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-[10px] text-[var(--color-text-secondary)]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <div className="border-t border-[var(--color-border)] pt-2 text-[10px] leading-relaxed text-[var(--color-text-placeholder)]">
        클릭: 포커스/고정 · 더블클릭: 페이지 열기 · 드래그: 위치 고정 · 우클릭:
        메뉴 · <kbd>/</kbd>: 검색
        {allNodesCount >= 500 ? " · 대규모 그래프 최적화 적용" : ""}
      </div>
    </Panel>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-text-secondary)]"
    >
      <span>{label}</span>
      <span
        className={`relative h-4 w-7 rounded-full transition ${
          checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            checked ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
