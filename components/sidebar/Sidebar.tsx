"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  FileText,
  Palette,
  Database,
  Orbit,
  Clock,
} from "lucide-react";
import { SiteLogo } from "@/components/branding/SiteLogo";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import { PageType } from "@/types";

interface SidebarProps {
  workspaceId: string;
  currentPageId?: string;
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

const typeLabels: Record<PageType, string> = {
  document: "Document",
  canvas: "Canvas",
  database: "Database",
};

function PageTreeItem({
  node,
  level,
  currentPageId,
  onSelect,
  onToggle,
  expanded,
}: {
  node: PageTreeNode;
  level: number;
  currentPageId?: string;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  expanded: Set<string>;
}) {
  const isExpanded = expanded.has(node.id);
  const isActive = node.id === currentPageId;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1 rounded-md cursor-pointer transition-colors ${
          isActive
            ? "bg-zinc-100 dark:bg-zinc-800 text-[#111110] dark:text-zinc-100"
            : "text-[#1a1a1a] dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50"
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px`, paddingRight: "8px" }}
        onClick={() => onSelect(node.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          className={`p-0.5 rounded transition-transform shrink-0 ${
            hasChildren ? "opacity-100" : "opacity-0"
          } ${isExpanded ? "rotate-90" : ""}`}
        >
          <ChevronRight className="w-3 h-3 text-[#6b6b6b]" />
        </button>

        <span className="text-[#6b6b6b] dark:text-zinc-500 shrink-0">
          {node.icon || typeIcons[node.type]}
        </span>

        <span className="flex-1 text-[13px] truncate">{node.title || "Untitled"}</span>
      </div>

      {isExpanded &&
        node.children.map((child) => (
          <PageTreeItem
            key={child.id}
            node={child}
            level={level + 1}
            currentPageId={currentPageId}
            onSelect={onSelect}
            onToggle={onToggle}
            expanded={expanded}
          />
        ))}
    </div>
  );
}

export function Sidebar({ workspaceId, currentPageId }: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);

  const { pages, fetchPages, createPage, getPageTree } = usePageStore();

  useEffect(() => {
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  const pageTree = getPageTree();
  const recentPages = [...pages]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 4);

  const handleToggle = (pageId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSelect = (pageId: string) => {
    router.push(`/workspace/${workspaceId}?page=${pageId}`);
  };

  const handleCreatePage = async (type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Canvas",
      database: "New Database",
    };

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId: null,
      workspaceId,
    });

    if (newPage) {
      setShowNewPageMenu(false);
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-[#e5e5e5] dark:border-zinc-800 bg-[#fbfbfa] dark:bg-[#111110] flex flex-col items-center py-3 gap-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#6b6b6b] dark:text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="workspace-sidebar"
      className="w-60 border-r border-[#e5e5e5] dark:border-zinc-800 bg-[#fbfbfa] dark:bg-[#111110] flex flex-col h-full overflow-hidden"
    >
      {/* Workspace Switcher */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="w-[22px] h-[22px] bg-[#2e7d45] rounded-[4px] flex items-center justify-center shrink-0">
          <span className="text-white text-[12px] font-semibold leading-none">A</span>
        </div>
        <span className="flex-1 text-[14px] font-medium text-[#1a1a1a] dark:text-zinc-100 truncate">
          obnofi
        </span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 rounded transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-[#6b6b6b] dark:text-zinc-400" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-2 flex flex-col">
        <div className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-[#6b6b6b] dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50 transition-colors">
          <Search className="w-4 h-4 shrink-0" />
          <span className="text-[13px]">Search</span>
        </div>

        <button className="flex items-center gap-2 px-2 py-1 rounded-md text-[#6b6b6b] dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50 transition-colors w-full text-left">
          <Settings className="w-4 h-4 shrink-0" />
          <span className="text-[13px]">Settings</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNewPageMenu(!showNewPageMenu)}
            className="flex items-center gap-2 px-2 py-1 rounded-md text-[#6b6b6b] dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50 transition-colors w-full text-left"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-[13px]">New page</span>
          </button>

          {showNewPageMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-50 py-1">
              {(["document", "database"] as PageType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleCreatePage(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  {typeIcons[type]}
                  {typeLabels[type]}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/workspace/${workspaceId}/graph`}
          data-testid="graph-view-link"
          className="flex items-center gap-2 px-2 py-1 rounded-md text-[#6b6b6b] dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <Orbit className="w-4 h-4 text-[#2E7D45] shrink-0" />
          <span className="text-[13px]">Graph View</span>
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#e5e5e5] dark:bg-zinc-800 mx-2 my-2" />

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto px-2 min-h-0">
        {pageTree.length > 0 ? (
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-0.5">
              <span className="text-[11px] font-medium text-[#9b9b9b] uppercase tracking-wide">
                Private
              </span>
              <button
                onClick={() => setShowNewPageMenu(!showNewPageMenu)}
                className="p-0.5 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#9b9b9b]" />
              </button>
            </div>
            {pageTree.map((node) => (
              <PageTreeItem
                key={node.id}
                node={node}
                level={0}
                currentPageId={currentPageId}
                onSelect={handleSelect}
                onToggle={handleToggle}
                expanded={expanded}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#9b9b9b] text-[13px]">
            No pages yet
          </div>
        )}
      </div>

      {/* Recent */}
      {recentPages.length > 0 && (
        <div className="border-t border-[#e5e5e5] dark:border-zinc-800 px-2 py-2 shrink-0">
          <div className="px-2 py-1 mb-0.5">
            <span className="text-[11px] font-medium text-[#9b9b9b] uppercase tracking-wide">
              Recent
            </span>
          </div>
          {recentPages.map((page) => (
            <button
              key={page.id}
              onClick={() => handleSelect(page.id)}
              className="flex items-center gap-2 px-2 py-1 rounded-md text-[#6b6b6b] dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50 transition-colors w-full text-left"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[13px] truncate">{page.title || "Untitled"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
