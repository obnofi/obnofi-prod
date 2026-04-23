"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Minus,
  AlertCircle,
  Table,
  BookOpen,
  Image,
  Video,
  Music,
  Paperclip,
  Bookmark,
  Code2,
  GitBranch,
  Table2,
  Kanban,
  LayoutGrid,
  LayoutList,
  Calendar,
  GanttChart,
  PenTool,
  Database,
  Network,
  Zap,
  GitGraph,
  GitPullRequest,
  ChevronDown,
  Sigma,
  Square,
  Link,
  LayoutTemplate,
  Globe,
  HardDrive,
  MessageSquare,
  AtSign,
  FileText,
  CalendarDays,
  Smile,
  BarChart2,
  Columns2,
  Columns3,
  ClipboardList,
} from "lucide-react";
import type { SlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";
import { CATEGORIES } from "@/components/editor/extensions/SlashCommandExtension";
import { usePageStore } from "@/store/pageStore";
import { useUIStore } from "@/store/useUIStore";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Minus,
  AlertCircle,
  Table,
  BookOpen,
  Image,
  Video,
  Music,
  Paperclip,
  Bookmark,
  Code2,
  GitBranch,
  Table2,
  Kanban,
  LayoutGrid,
  LayoutList,
  Calendar,
  GanttChart,
  PenTool,
  Database,
  Network,
  Zap,
  GitGraph,
  GitPullRequest,
  ChevronDown,
  Sigma,
  Square,
  Link,
  LayoutTemplate,
  Globe,
  HardDrive,
  MessageSquare,
  AtSign,
  FileText,
  CalendarDays,
  Smile,
  BarChart2,
  Columns2,
  Columns3,
  ClipboardList,
};

function showToast(message: string) {
  const existing = document.getElementById("slash-cmd-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "slash-cmd-toast";
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#18181b",
    color: "#fafafa",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    zIndex: "100000",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity 0.15s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
  });
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 2200);
}

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  editor: Editor;
  range: { from: number; to: number };
  workspaceId?: string;
  pageId?: string;
  onLinkDatabase?: () => void;
  onInsertButton?: () => void;
  onInsertPageLink?: () => void;
}

type ItemWithIndex = SlashCommandItem & { globalIndex: number };
type GroupWithIndex = {
  id: string;
  label: string;
  items: ItemWithIndex[];
};

export function SlashCommandList({
  items,
  editor,
  range,
  workspaceId,
  pageId,
  onLinkDatabase,
  onInsertButton,
  onInsertPageLink,
}: SlashCommandListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { createPage } = usePageStore();
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);

  // Build groups with stable global indices in category display order
  const { groups, flatItems } = useMemo<{
    groups: GroupWithIndex[];
    flatItems: ItemWithIndex[];
  }>(() => {
    let idx = 0;
    const builtGroups: GroupWithIndex[] = CATEGORIES.map((cat) => ({
      ...cat,
      items: items
        .filter((item) => item.category === cat.id)
        .map((item) => ({ ...item, globalIndex: idx++ })),
    })).filter((g) => g.items.length > 0);

    return {
      groups: builtGroups,
      flatItems: builtGroups.flatMap((g) => g.items),
    };
  }, [items]);

  const handleSelect = useCallback(
    (item: SlashCommandItem) => {
      if (item.isDisabled) {
        showToast("준비 중입니다 🚧");
        return;
      }

      const chain = editor.chain().focus().deleteRange(range);

      switch (item.id) {
        case "text":
          chain.setParagraph().run();
          break;
        case "h1":
          chain.setHeading({ level: 1 }).run();
          break;
        case "h2":
          chain.setHeading({ level: 2 }).run();
          break;
        case "h3":
          chain.setHeading({ level: 3 }).run();
          break;
        case "h4":
          chain.setHeading({ level: 4 }).run();
          break;
        case "h5":
          chain.setHeading({ level: 5 }).run();
          break;
        case "h6":
          chain.setHeading({ level: 6 }).run();
          break;
        case "bulletList":
          chain.toggleBulletList().run();
          break;
        case "orderedList":
          chain.toggleOrderedList().run();
          break;
        case "blockquote":
          chain.toggleBlockquote().run();
          break;
        case "divider":
          chain.setHorizontalRule().run();
          break;
        case "codeBlock":
          (chain as typeof chain & { insertCodeBlock: () => typeof chain })
            .insertCodeBlock()
            .run();
          break;
        case "dbTable":
          chain.insertDatabaseEmbed().run();
          break;
        case "canvas":
          chain.insertCanvasEmbed().run();
          break;
        case "dbDiagram":
          (chain as typeof chain & { insertDbDiagram: () => typeof chain })
            .insertDbDiagram()
            .run();
          break;
        case "columns2":
          chain.insertColumnLayout({ columns: 2 }).run();
          break;
        case "columns3":
          chain.insertColumnLayout({ columns: 3 }).run();
          break;
        case "math":
          chain.insertMathBlock().run();
          break;
        case "button":
          chain.run();
          onInsertButton?.();
          return;

        case "linkDatabase":
          chain.run();
          onLinkDatabase?.();
          break;
        case "pageLink":
        case "pageMention":
          chain.run();
          onInsertPageLink?.();
          return;
        case "template-meeting":
          chain.run();
          editor.commands.insertContent(
            `<h1>회의록</h1><p><strong>일시:</strong> </p><p><strong>참석자:</strong> </p><h2>안건</h2><ul><li><p></p></li></ul><h2>메모</h2><p></p><h2>액션 아이템</h2><ul><li><p></p></li></ul>`
          );
          break;
        case "template-project":
          chain.run();
          editor.commands.insertContent(
            `<h1>프로젝트 브리프</h1><h2>개요</h2><p></p><h2>목표</h2><ul><li><p></p></li></ul><h2>범위</h2><p></p><h2>결과물</h2><ul><li><p></p></li></ul><h2>일정</h2><p></p>`
          );
          break;
        case "template-weekly":
          chain.run();
          editor.commands.insertContent(
            `<h1>주간 플래너</h1><h2>이번 주 목표</h2><ul><li><p></p></li></ul><h2>월</h2><p></p><h2>화</h2><p></p><h2>수</h2><p></p><h2>목</h2><p></p><h2>금</h2><p></p><h2>회고</h2><p></p>`
          );
          break;
        case "subPage":
          chain.run();
          (async () => {
            if (!workspaceId || !pageId) return;
            const newPage = await createPage({
              title: "새 페이지",
              type: "document",
              parentId: pageId,
              workspaceId,
            });
            if (newPage) {
              editor.commands.insertSubPageEmbed({
                pageId: newPage.id,
                workspaceId,
                parentPageId: pageId,
              });
              openGrovePageSideTab(newPage.id, workspaceId);
            }
          })();
          return;
        default:
          chain.run();
      }
    },
    [editor, range, workspaceId, pageId, createPage, openGrovePageSideTab]
  );

  // Reset selected index when item list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? flatItems.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev >= flatItems.length - 1 ? 0 : prev + 1
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) handleSelect(item);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flatItems, selectedIndex, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (flatItems.length === 0) return null;

  return (
    <div className="scrollbar-hidden z-[100000] max-h-[22rem] w-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
      {groups.map((group) => (
        <div key={group.id}>
          {/* Category header */}
          <div className="sticky top-0 px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 select-none">
            {group.label}
          </div>

          {/* Items */}
          {group.items.map((item) => {
            const isSelected = item.globalIndex === selectedIndex;
            const Icon = iconMap[item.icon];

            return (
              <button
                key={item.id}
                type="button"
                ref={(el) => {
                  itemRefs.current[item.globalIndex] = el;
                }}
                onClick={() => handleSelect(item)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors",
                  isSelected
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                  item.isDisabled ? "opacity-50" : "",
                ].join(" ")}
              >
                {/* Icon */}
                <div
                  className={[
                    "flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center",
                    item.isObnofi
                      ? "bg-[#EAF3DE] border-[#c5dfa8] dark:bg-[#1a2e12] dark:border-[#3a5c24]"
                      : "bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700",
                  ].join(" ")}
                >
                  {Icon ? (
                    <Icon
                      className={[
                        "w-4 h-4",
                        item.isObnofi
                          ? "text-[#3a6e28] dark:text-[#7cbf5e]"
                          : "text-zinc-600 dark:text-zinc-400",
                      ].join(" ")}
                    />
                  ) : null}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                      {item.title}
                    </span>
                    {item.isDisabled && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-px leading-none">
                        준비중
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-snug">
                    {item.description}
                  </div>
                </div>

                {/* Shortcut badge */}
                {item.shortcut && (
                  <kbd className="flex-shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 font-mono leading-none">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
