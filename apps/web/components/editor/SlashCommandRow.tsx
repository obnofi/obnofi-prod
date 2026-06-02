"use client";

import {
  Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, CheckSquare, ChevronRight, Quote, Minus, AlertCircle,
  Table, BookOpen, Image, Video, Music, Paperclip, Bookmark, Code2,
  GitBranch, Table2, Kanban, LayoutGrid, LayoutList, Calendar, GanttChart,
  PenTool, Database, Network, Zap, GitGraph, GitPullRequest, ChevronDown,
  Sigma, Square, Link, LayoutTemplate, Globe, HardDrive, MessageSquare,
  AtSign, FileText, CalendarDays, Smile, BarChart2, Columns2, Columns3,
  ClipboardList, Waypoints,
} from "lucide-react";

export const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, CheckSquare, ChevronRight, Quote, Minus, AlertCircle,
  Table, BookOpen, Image, Video, Music, Paperclip, Bookmark, Code2,
  GitBranch, Table2, Kanban, LayoutGrid, LayoutList, Calendar, GanttChart,
  PenTool, Database, Network, Zap, GitGraph, GitPullRequest, ChevronDown,
  Sigma, Square, Link, LayoutTemplate, Globe, HardDrive, MessageSquare,
  AtSign, FileText, CalendarDays, Smile, BarChart2, Columns2, Columns3,
  ClipboardList, Waypoints,
};

export function shortcutBadge(text: string) {
  return (
    <kbd
      className="flex-shrink-0 text-[10px] font-mono leading-none"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {text}
    </kbd>
  );
}

interface SlashCommandRowProps {
  iconName: string;
  title: string;
  isSelected: boolean;
  isDisabled: boolean;
  rightAdornment: React.ReactNode;
  onMouseEnter: () => void;
  onClick: () => void;
  refCallback: (el: HTMLButtonElement | null) => void;
}

export function SlashCommandRow({
  iconName,
  title,
  isSelected,
  isDisabled,
  rightAdornment,
  onMouseEnter,
  onClick,
  refCallback,
}: SlashCommandRowProps) {
  const Icon = iconMap[iconName];
  return (
    <div className="px-1">
      <button
        type="button"
        ref={refCallback}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        data-selected={isSelected ? "true" : undefined}
        style={{
          background: isSelected ? "var(--color-selected)" : undefined,
          color: "var(--color-text-primary)",
        }}
        className={[
          "slash-cmd-row w-full flex items-center gap-2 px-2 py-1 rounded-[6px] text-left",
          isDisabled ? "opacity-50" : "",
        ].join(" ")}
      >
        {Icon ? (
          <Icon
            className="flex-shrink-0 w-3.5 h-3.5"
            style={{ color: "var(--color-text-secondary)" }}
          />
        ) : null}
        <span className="flex-1 truncate text-[13px] leading-5">{title}</span>
        {isDisabled && (
          <span
            className="flex-shrink-0 text-[9px] uppercase tracking-wide"
            style={{ color: "var(--color-text-placeholder)" }}
          >
            준비중
          </span>
        )}
        {rightAdornment}
      </button>
    </div>
  );
}
