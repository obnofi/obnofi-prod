"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Search,
  Settings,
  Plus,
  FileText,
  Palette,
  Database,
  Orbit,
  Clock,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import { PageType } from "@obnofi/types";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

interface PageTreeItemProps {
  node: PageTreeNode;
  level: number;
  currentPageId?: string;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  expanded: Set<string>;
  onCreateChild: (parentId: string, type: PageType) => void;
  onDelete: (pageId: string) => void;
  activeMenuNodeId: string | null;
  onOpenMenu: (nodeId: string, buttonEl: HTMLButtonElement) => void;
  onCloseMenu: () => void;
}

function PageTreeItem({
  node,
  level,
  currentPageId,
  onSelect,
  onToggle,
  expanded,
  onCreateChild,
  onDelete,
  activeMenuNodeId,
  onOpenMenu,
  onCloseMenu,
}: PageTreeItemProps) {
  const isExpanded = expanded.has(node.id);
  const isActive = node.id === currentPageId;
  const hasChildren = node.children.length > 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMenuOpen = activeMenuNodeId === node.id;

  const handleOpenMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      onOpenMenu(node.id, buttonRef.current);
    }
  }, [node.id, onOpenMenu]);

  const handleCreateChild = useCallback((type: PageType) => {
    onCreateChild(node.id, type);
    onCloseMenu();
  }, [node.id, onCreateChild, onCloseMenu]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(node.id);
    onCloseMenu();
  }, [node.id, onDelete, onCloseMenu]);

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1 rounded cursor-pointer transition-colors ${
          isActive
            ? "bg-[var(--color-selected)] text-[var(--color-text-primary)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
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
          <ChevronDown className="w-3 h-3 text-[var(--color-text-secondary)]" />
        </button>
        <span className="text-[var(--color-text-secondary)] shrink-0">
          {node.icon || typeIcons[node.type]}
        </span>
        <span className="flex-1 text-[13px] truncate">{node.title || "Untitled"}</span>
        
        <button
          onClick={(e) => { e.stopPropagation(); onCreateChild(node.id, "document"); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--color-hover)] transition-all"
          title="하위 페이지 추가"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
        </button>
        <button
          ref={buttonRef}
          onClick={handleOpenMenu}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--color-hover)] transition-all"
          title="더보기"
        >
          <MoreHorizontal className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
        </button>
      </div>
      
      {isExpanded &&
        node.children.map((child) => (
          <div key={child.id} className="relative">
            <div
              className="absolute bottom-0 top-0 w-px bg-[var(--color-border)]"
              style={{ left: `${level * 14 + 15}px` }}
            />
            <PageTreeItem
              node={child}
              level={level + 1}
              currentPageId={currentPageId}
              onSelect={onSelect}
              onToggle={onToggle}
              expanded={expanded}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              activeMenuNodeId={activeMenuNodeId}
              onOpenMenu={onOpenMenu}
              onCloseMenu={onCloseMenu}
            />
          </div>
        ))}
    </div>
  );
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <Suspense fallback={null}>
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
    </Suspense>
  );
}

function WorkspaceLayoutInner({ children }: WorkspaceLayoutProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  
  // Menu state for child page creation
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const { pages, fetchPages, getPageTree, createPage, deletePage } = usePageStore();
  const searchParams = useSearchParams();
  const currentPageId = searchParams.get("page") ?? undefined;
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!activeMenuNodeId) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target?.closest?.("[data-page-tree-menu]")) return;
      if (menuButtonRef.current && !menuButtonRef.current.contains(target as Node)) {
        setActiveMenuNodeId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuNodeId]);
  
  const handleOpenMenu = useCallback((nodeId: string, buttonEl: HTMLButtonElement) => {
    const rect = buttonEl.getBoundingClientRect();
    setMenuPosition({
      top: rect.top,
      left: rect.right + 4,
    });
    menuButtonRef.current = buttonEl;
    setActiveMenuNodeId(nodeId);
  }, []);
  
  const handleCloseMenu = useCallback(() => {
    setActiveMenuNodeId(null);
    menuButtonRef.current = null;
  }, []);

  // Re-fetch whenever the active page changes so newly created pages appear
  useEffect(() => {
    if (workspaceId) {
      fetchPages(workspaceId);
    }
  }, [workspaceId, fetchPages, currentPageId]);

  // Auto-expand ancestors of the current page
  useEffect(() => {
    if (!currentPageId) return;
    setExpandedPages((prev) => {
      const next = new Set(prev);
      let page = pages.find((p) => p.id === currentPageId);
      while (page?.parentId) {
        next.add(page.parentId);
        page = pages.find((p) => p.id === page?.parentId);
      }
      return next;
    });
  }, [currentPageId, pages]);

  const pageTree = getPageTree();
  const recentPages = [...pages]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const handleToggleExpand = (pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSelectPage = (pageId: string) => {
    router.push(`/workspace/${workspaceId}?page=${pageId}`);
  };

  const handleCreatePage = async (type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Clearing",
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

  const handleDeletePage = async (pageId: string) => {
    await deletePage(pageId);
    if (currentPageId === pageId) {
      router.push(`/workspace/${workspaceId}`);
    }
  };

  const handleCreateChildPage = async (parentId: string, type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Clearing",
      database: "New Database",
    };

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId,
      workspaceId,
    });

    if (newPage) {
      // Expand parent to show new child
      setExpandedPages((prev) => new Set([...prev, parentId]));
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden">
        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="w-[22px] h-[22px] bg-[#2e7d45] rounded flex items-center justify-center shrink-0">
            <span className="text-white text-[12px] font-semibold">W</span>
          </div>
          <span className="flex-1 text-[14px] font-medium text-[var(--color-text-primary)] truncate">Workspace</span>
          <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </div>

        {/* Quick Actions */}
        <div className="px-2 flex flex-col gap-0.5">
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]">
            <Search className="w-4 h-4" />Search
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]">
            <Settings className="w-4 h-4" />Settings
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNewPageMenu(!showNewPageMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px] w-full text-left"
            >
              <Plus className="w-4 h-4" />New page
            </button>
            {showNewPageMenu && (
              <div className="absolute top-full left-0 right-0 z-[99999] mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
                {(["document", "database"] as PageType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleCreatePage(type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition-colors"
                  >
                    {typeIcons[type]}
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link href={`/workspace/${workspaceId}/graph`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]">
            <Orbit className="w-4 h-4" />Graph View
          </Link>
        </div>

        {/* Files - Page Tree */}
        <div className="px-2 mt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">Files</span>
            <button onClick={() => setShowNewPageMenu(!showNewPageMenu)} className="p-0.5 rounded hover:bg-[var(--color-hover)]">
              <Plus className="w-3.5 h-3.5 text-[var(--color-text-placeholder)]" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {pageTree.map((node) => (
              <PageTreeItem
                key={node.id}
                node={node}
                level={0}
                currentPageId={currentPageId}
                onSelect={handleSelectPage}
                onToggle={handleToggleExpand}
                expanded={expandedPages}
                onCreateChild={handleCreateChildPage}
                onDelete={handleDeletePage}
                activeMenuNodeId={activeMenuNodeId}
                onOpenMenu={handleOpenMenu}
                onCloseMenu={handleCloseMenu}
              />
            ))}
          </div>
        </div>

        {/* Recent */}
        {recentPages.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-2 py-2 shrink-0">
            <div className="px-2 py-1 text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">Recent</div>
            <div className="flex flex-col gap-0.5">
              {recentPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page.id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {page.title || "Untitled"}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
      
      {/* Portal for page tree menu - rendered outside sidebar */}
      {activeMenuNodeId && typeof document !== "undefined" && (
        <PageTreeMenuPortal
          position={menuPosition}
          nodeId={activeMenuNodeId}
          onDelete={() => {
            handleDeletePage(activeMenuNodeId);
            handleCloseMenu();
          }}
          onClose={handleCloseMenu}
        />
      )}
    </div>
  );
}

// Menu portal component
interface PageTreeMenuPortalProps {
  position: { top: number; left: number };
  nodeId: string;
  onDelete: () => void;
  onClose: () => void;
}

function PageTreeMenuPortal({ position, onDelete, onClose }: PageTreeMenuPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Adjust position if menu goes off screen
  const adjustedPosition = { ...position };
  if (typeof window !== "undefined") {
    const menuWidth = 140;
    const menuHeight = 120;
    if (position.left + menuWidth > window.innerWidth) {
      adjustedPosition.left = position.left - menuWidth - 24;
    }
    if (position.top + menuHeight > window.innerHeight) {
      adjustedPosition.top = window.innerHeight - menuHeight - 10;
    }
  }

  const menuContent = (
    <div
      ref={menuRef}
      data-page-tree-menu
      className="fixed rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg min-w-[120px]"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 99999,
      }}
    >
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        삭제
      </button>
    </div>
  );

  return createPortal(menuContent, document.body);
}
