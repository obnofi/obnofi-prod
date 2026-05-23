"use client";

import { useEffect, useState, useRef, useCallback, useMemo, startTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  X,
} from "lucide-react";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { ImportFromUrlControl } from "@/components/workspace/ImportFromUrlControl";
import { AntGlyph } from "@/components/icons/AntGlyph";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { getUserColor } from "@/lib/collaborationUtils";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import {
  creatablePageLabels,
  creatablePageTypes,
  createPageTitles,
} from "@/lib/pageCreation";
import { Page, PageType } from "@obnofi/types";

interface WorkspaceSidebarProps {
  workspaceId: string;
}

interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  ownerId: string;
  ownerImage: string | null;
  role: "OWNER" | "EDITOR" | "VIEWER" | "MEMBER";
  createdAt: string;
  updatedAt: string;
}

type SearchMode = "title" | "content" | "title_content";

interface PageSearchResult {
  id: string;
  title: string;
  type: PageType;
  icon: string | null;
  parentId: string | null;
  updatedAt: string;
  snippet: string;
  matchedIn: SearchMode;
}

function WorkspaceGlyph({
  icon,
  image,
  label,
}: {
  icon: string | null;
  image?: string | null;
  label: string;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt={label}
        width={22}
        height={22}
        className="h-[22px] w-[22px] shrink-0 rounded-md object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--color-surface)] text-[12px]"
      title={label}
    >
      {icon || "🌿"}
    </span>
  );
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

const PAGE_TREE_INDENT = 14;
const PAGE_ORDER_STEP = 1024;
const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 420;
const SIDEBAR_WIDTH_STORAGE_KEY = "obnofi-workspace-sidebar-width";
const SIDEBAR_HIDDEN_STORAGE_KEY = "obnofi-workspace-sidebar-hidden";

const searchModeLabels: Record<SearchMode, string> = {
  title: "제목",
  content: "내용",
  title_content: "제목 + 전체내용",
};

interface FlattenedPageNode extends Page {
  depth: number;
  hasChildren: boolean;
}

interface ProjectedDrop {
  depth: number;
  parentId: string | null;
}

interface PageTreeItemProps {
  page: FlattenedPageNode;
  currentPageId?: string;
  activeAudience: Array<{ userId: string; userName: string }>;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  expanded: Set<string>;
  onOpenCreateMenu: (parentId: string | null, buttonEl: HTMLButtonElement) => void;
  onOpenMenu: (nodeId: string, buttonEl: HTMLButtonElement) => void;
  projectedDepth?: number;
  isDragging?: boolean;
}

function getUserInitials(userName: string) {
  const trimmed = userName.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function flattenVisiblePageTree(
  nodes: PageTreeNode[],
  expanded: Set<string>,
  depth = 0
): FlattenedPageNode[] {
  return nodes.flatMap((node) => {
    const current: FlattenedPageNode = {
      ...node,
      depth,
      hasChildren: node.children.length > 0,
    };

    if (!expanded.has(node.id)) {
      return [current];
    }

    return [current, ...flattenVisiblePageTree(node.children, expanded, depth + 1)];
  });
}

function collectDescendantIds(node: PageTreeNode): string[] {
  return node.children.flatMap((child) => [child.id, ...collectDescendantIds(child)]);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getProjectedDropPosition(
  items: FlattenedPageNode[],
  activeId: string,
  overId: string,
  dragOffsetX: number
): ProjectedDrop | null {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1) {
    return null;
  }

  const activeItem = items[activeIndex];
  const reordered = arrayMove(items, activeIndex, overIndex);
  const previousItem = reordered[overIndex - 1];
  const nextItem = reordered[overIndex + 1];
  const dragDepth = activeItem.depth + Math.round(dragOffsetX / PAGE_TREE_INDENT);
  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;
  const depth = clamp(dragDepth, minDepth, maxDepth);

  let parentId: string | null = null;

  if (depth === 0) {
    parentId = null;
  } else if (previousItem) {
    if (depth > previousItem.depth) {
      parentId =
        nextItem && depth === nextItem.depth + 1
          ? nextItem.id
          : previousItem.id;
    } else if (depth === previousItem.depth) {
      parentId = previousItem.parentId;
    } else {
      const ancestor = reordered
        .slice(0, overIndex)
        .reverse()
        .find((item) => item.depth === depth - 1);
      parentId = ancestor?.id ?? null;
    }
  }

  return { depth, parentId };
}

function getReorderedSiblingIds(
  items: FlattenedPageNode[],
  activeId: string,
  overId: string,
  projected: ProjectedDrop
) {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1) {
    return [];
  }

  const reordered = arrayMove(items, activeIndex, overIndex).map((item) =>
    item.id === activeId
      ? { ...item, depth: projected.depth, parentId: projected.parentId }
      : item
  );

  return reordered
    .filter((item) => item.parentId === projected.parentId)
    .map((item) => item.id);
}

function SortablePageTreeItem({
  page,
  currentPageId,
  activeAudience,
  onSelect,
  onToggle,
  expanded,
  onOpenCreateMenu,
  onOpenMenu,
  projectedDepth,
  isDragging = false,
}: PageTreeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: page.id });
  const isExpanded = expanded.has(page.id);
  const isActive = page.id === currentPageId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const depth = projectedDepth ?? page.depth;
  const visibleAudience = activeAudience.slice(0, 1);
  const extraAudienceCount = Math.max(0, activeAudience.length - visibleAudience.length);

  const handleOpenMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      onOpenMenu(page.id, buttonRef.current);
    }
  }, [page.id, onOpenMenu]);

  const handleOpenCreateMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (createButtonRef.current) {
      onOpenCreateMenu(page.id, createButtonRef.current);
    }
  }, [page.id, onOpenCreateMenu]);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div
        {...attributes}
        {...listeners}
        data-testid={`sidebar-page-${page.id}`}
        className={`group flex items-center gap-1.5 py-1 rounded transition-colors ${
          isActive
            ? "bg-[var(--color-selected)] text-[var(--color-text-primary)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
        } ${isDragging ? "opacity-60" : ""}`}
        style={{ paddingLeft: `${depth * PAGE_TREE_INDENT + 8}px`, paddingRight: "8px" }}
        onClick={() => onSelect(page.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (page.hasChildren) onToggle(page.id);
          }}
          className={`p-0.5 rounded transition-transform shrink-0 ${
            page.hasChildren ? "opacity-100" : "opacity-0"
          } ${isExpanded ? "rotate-270" : ""}`}
        >
          <ChevronDown className="w-3 h-3 text-[var(--color-text-secondary)]" />
        </button>
        <span className="text-[var(--color-text-secondary)] shrink-0">
          {page.icon || typeIcons[page.type]}
        </span>
        <span className="flex-1 text-[13px] truncate">{page.title || "Untitled"}</span>
        {activeAudience.length > 0 ? (
          <div className="flex items-center gap-1">
            {visibleAudience.map((user) => (
              <span
                key={user.userId}
                data-testid={`user-avatar-${user.userId}`}
                title={user.userName}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: getUserColor(user.userId) }}
              >
                {getUserInitials(user.userName)}
              </span>
            ))}
            {extraAudienceCount > 0 ? (
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                +{extraAudienceCount}
              </span>
            ) : null}
          </div>
        ) : null}
        
        <button
          ref={createButtonRef}
          onClick={handleOpenCreateMenu}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--color-hover)] transition-all"
          title="하위 항목 추가"
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
    </div>
  );
}

function SearchDialog({
  isOpen,
  query,
  mode,
  isLoading,
  results,
  error,
  onClose,
  onQueryChange,
  onModeChange,
  onSelectPage,
}: {
  isOpen: boolean;
  query: string;
  mode: SearchMode;
  isLoading: boolean;
  results: PageSearchResult[];
  error: string | null;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSelectPage: (pageId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-start justify-center bg-black/30 px-4 py-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
          <input
            ref={inputRef}
            name="page-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="페이지 제목이나 본문 검색"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
            aria-label="검색 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[var(--color-border)] px-4 py-3">
          {(Object.keys(searchModeLabels) as SearchMode[]).map((searchMode) => {
            const isActive = mode === searchMode;
            return (
              <button
                key={searchMode}
                type="button"
                onClick={() => onModeChange(searchMode)}
                className={`rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                }`}
              >
                {searchModeLabels[searchMode]}
              </button>
            );
          })}
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              검색어를 입력하면 페이지 제목, 본문, 또는 둘 다 기준으로 찾습니다.
            </div>
          ) : isLoading ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              검색 중...
            </div>
          ) : error ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => onSelectPage(result.id)}
                  className="rounded-lg px-3 py-3 text-left hover:bg-[var(--color-hover)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[14px] text-[var(--color-text-secondary)]">
                      {result.icon || typeIcons[result.type]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-text-primary)]">
                      {result.title}
                    </span>
                    <span className="rounded bg-[var(--color-surface)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {searchModeLabels[result.matchedIn]}
                    </span>
                  </div>
                  {result.snippet ? (
                    <p className="mt-1 pl-7 text-[12px] leading-5 text-[var(--color-text-secondary)]">
                      {result.snippet}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function WorkspaceSidebar({ workspaceId }: WorkspaceSidebarProps) {
  return <WorkspaceSidebarInner workspaceId={workspaceId} />;
}

function WorkspaceSidebarInner({ workspaceId }: WorkspaceSidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const collaboration = useCollaboration();
  const awarenessStates = Array.isArray(collaboration.awarenessStates)
    ? collaboration.awarenessStates
    : [];
  const updateCursor = collaboration.updateCursor ?? (() => {});
  const localUserId = collaboration.localUserId ?? null;
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title_content");
  const [searchResults, setSearchResults] = useState<PageSearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeDragPageId, setActiveDragPageId] = useState<string | null>(null);
  const [overDragPageId, setOverDragPageId] = useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [pendingPageId, setPendingPageId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [createMenuState, setCreateMenuState] = useState<{
    parentId: string | null;
    position: { top: number; left: number };
  } | null>(null);
  
  // Menu state for child page creation
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const filesCreateButtonRef = useRef<HTMLButtonElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const sidebarResizeStateRef = useRef<{
    startX: number;
    startWidth: number;
  } | null>(null);

  const { pages, fetchPages, getPageTree, createPage, updatePage, deletePage } = usePageStore();
  const initializedWorkspaceId = usePageStore((state) => state.initializedWorkspaceId);
  const searchParams = useSearchParams();
  const currentPageId = searchParams.get("page") ?? undefined;
  const effectiveCurrentPageId = pendingPageId ?? currentPageId;
  const pageAudienceById = useMemo(() => {
    const audienceMap = new Map<string, Array<{ userId: string; userName: string }>>();

    awarenessStates.forEach((state) => {
      if (
        state.userId === localUserId ||
        !state.userCursor?.pageId
      ) {
        return;
      }

      const currentAudience = audienceMap.get(state.userCursor.pageId) ?? [];
      currentAudience.push({ userId: state.userId, userName: state.userName });
      audienceMap.set(state.userCursor.pageId, currentAudience);
    });

    return audienceMap;
  }, [awarenessStates, localUserId]);

  useEffect(() => {
    setIsSearchOpen(false);
    setShowNewPageMenu(false);
    setIsWorkspaceMenuOpen(false);
    setActiveMenuNodeId(null);
    setCreateMenuState(null);
  }, [workspaceId, currentPageId]);

  useEffect(() => {
    if (!effectiveCurrentPageId) {
      return;
    }

    updateCursor({
      type: "page",
      pageId: effectiveCurrentPageId,
      canvasPosition: null,
      databaseCell: null,
    });

    return () => {
      updateCursor(null);
    };
  }, [effectiveCurrentPageId, updateCursor]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // distance 기반 — 단순 클릭은 즉시 onClick으로 흘리고, 6px 이상 끌었을 때만 drag 시작.
      // delay 기반은 hold 동안 click 이벤트가 종종 swallow돼 페이지 전환이 안 되는 문제가 있었음.
      activationConstraint: { distance: 6 },
    })
  );
  // SSR(WorkspacePage가 setPages로 채움) 또는 fetch가 끝나면 false. 그 전엔 트리 자리에 스켈레톤 표시.
  const showPageTreeSkeleton = initializedWorkspaceId !== workspaceId;
  
  // Close menu when clicking outside
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const savedHidden = window.localStorage.getItem(SIDEBAR_HIDDEN_STORAGE_KEY);

    if (savedWidth) {
      const parsedWidth = Number(savedWidth);
      if (Number.isFinite(parsedWidth)) {
        setSidebarWidth(clamp(parsedWidth, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH));
      }
    }

    if (savedHidden === "true") {
      setIsSidebarHidden(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SIDEBAR_HIDDEN_STORAGE_KEY, String(isSidebarHidden));
  }, [isSidebarHidden]);

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

  useEffect(() => {
    if (!createMenuState) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target?.closest?.("[data-page-create-menu]")) return;
      if (
        filesCreateButtonRef.current &&
        filesCreateButtonRef.current.contains(target as Node)
      ) {
        return;
      }
      setCreateMenuState(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createMenuState]);

  useEffect(() => {
    if (!isWorkspaceMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (workspaceMenuRef.current?.contains(target as Node)) {
        return;
      }
      setIsWorkspaceMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isWorkspaceMenuOpen]);
  
  const handleOpenMenu = useCallback((nodeId: string, buttonEl: HTMLButtonElement) => {
    const rect = buttonEl.getBoundingClientRect();
    setCreateMenuState(null);
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

  const handleOpenCreateMenu = useCallback(
    (parentId: string | null, buttonEl: HTMLButtonElement) => {
      const rect = buttonEl.getBoundingClientRect();
      handleCloseMenu();
      setCreateMenuState({
        parentId,
        position: {
          top: rect.bottom + 4,
          left: rect.left,
        },
      });
    },
    [handleCloseMenu]
  );

  const handleCloseCreateMenu = useCallback(() => {
    setCreateMenuState(null);
  }, []);

  const handleHideSidebar = useCallback(() => {
    setShowNewPageMenu(false);
    setIsWorkspaceMenuOpen(false);
    handleCloseMenu();
    handleCloseCreateMenu();
    setIsSidebarHidden(true);
  }, [handleCloseCreateMenu, handleCloseMenu]);

  const handleShowSidebar = useCallback(() => {
    setIsSidebarHidden(false);
  }, []);

  const handleSidebarResizeStart = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    sidebarResizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };
  }, [sidebarWidth]);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      const resizeState = sidebarResizeStateRef.current;
      if (!resizeState) {
        return;
      }

      const nextWidth = clamp(
        resizeState.startWidth + (event.clientX - resizeState.startX),
        MIN_SIDEBAR_WIDTH,
        MAX_SIDEBAR_WIDTH
      );
      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      sidebarResizeStateRef.current = null;
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, []);

  // 같은 워크스페이스가 이미 SSR로 채워져 있으면 fetch 스킵 — 첫 진입 시 중복 요청 제거.
  // store 최신값을 effect 안에서 직접 읽어, child(WorkspacePage)의 setPages 이후에 검사한다.
  useEffect(() => {
    if (!workspaceId) return;
    if (usePageStore.getState().initializedWorkspaceId === workspaceId) return;
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        if (!response.ok) {
          return;
        }

        const nextWorkspaces = (await response.json()) as WorkspaceOption[];
        if (!cancelled) {
          setWorkspaces(nextWorkspaces);
        }
      } catch {
        // Leave the switcher collapsed on failure.
      }
    };

    void loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-expand ancestors of the current page
  useEffect(() => {
    if (!currentPageId) return;
    setExpandedPages((prev) => {
      let next: Set<string> | null = null;
      const visited = new Set<string>([currentPageId]);
      let page = pages.find((p) => p.id === currentPageId);
      while (page?.parentId) {
        if (visited.has(page.parentId)) break; // 순환 참조 방어
        visited.add(page.parentId);
        if (!prev.has(page.parentId)) {
          if (!next) {
            next = new Set(prev);
          }
          next.add(page.parentId);
        }
        page = pages.find((p) => p.id === page?.parentId);
      }
      return next ?? prev;
    });
  }, [currentPageId, pages]);

  useEffect(() => {
    if (!pendingPageId) {
      return;
    }

    if (currentPageId === pendingPageId) {
      setPendingPageId(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingPageId((currentPendingPageId) =>
        currentPendingPageId === pendingPageId ? null : currentPendingPageId
      );
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [currentPageId, pendingPageId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!isSearchOpen) {
      return;
    }

    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/pages/search?workspaceId=${encodeURIComponent(
            workspaceId
          )}&q=${encodeURIComponent(query)}&mode=${encodeURIComponent(searchMode)}`
        );

        if (!response.ok) {
          throw new Error("검색 결과를 불러오지 못했습니다.");
        }

        const nextResults = (await response.json()) as PageSearchResult[];
        if (!cancelled) {
          setSearchResults(nextResults);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(
            error instanceof Error ? error.message : "검색 결과를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearchLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isSearchOpen, searchMode, searchQuery, workspaceId]);

  const pageTree = useMemo(() => getPageTree(), [pages]); // eslint-disable-line react-hooks/exhaustive-deps
  const pageTreeMap = useMemo(() => {
    const map = new Map<string, PageTreeNode>();

    const visit = (nodes: PageTreeNode[]) => {
      nodes.forEach((node) => {
        map.set(node.id, node);
        visit(node.children);
      });
    };

    visit(pageTree);
    return map;
  }, [pageTree]);
  const hiddenDraggedDescendantIds = useMemo(() => {
    if (!activeDragPageId) {
      return new Set<string>();
    }

    const activeNode = pageTreeMap.get(activeDragPageId);
    return new Set(activeNode ? collectDescendantIds(activeNode) : []);
  }, [activeDragPageId, pageTreeMap]);
  const visiblePageTreeItems = useMemo(
    () =>
      flattenVisiblePageTree(pageTree, expandedPages).filter(
        (item) => !hiddenDraggedDescendantIds.has(item.id)
      ),
    [pageTree, expandedPages, hiddenDraggedDescendantIds]
  );
  const projectedDrop = useMemo(() => {
    if (!activeDragPageId || !overDragPageId || visiblePageTreeItems.length === 0) {
      return null;
    }

    return getProjectedDropPosition(
      visiblePageTreeItems,
      activeDragPageId,
      overDragPageId,
      dragOffsetX
    );
  }, [activeDragPageId, overDragPageId, dragOffsetX, visiblePageTreeItems]);
  const recentPages = useMemo(
    () =>
      [...pages]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [pages]
  );
  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
  const currentWorkspaceOwnerImage =
    currentWorkspace?.ownerImage ??
    (currentWorkspace?.ownerId === session?.user?.id ? session?.user?.image ?? null : null);
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
    if (pageId === currentPageId) {
      return;
    }

    setPendingPageId(pageId);
    startTransition(() => {
      router.push(`/workspace/${workspaceId}?page=${pageId}`);
    });
  };

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const handleSelectSearchResult = useCallback((pageId: string) => {
    setIsSearchOpen(false);
    if (pageId === currentPageId) {
      return;
    }

    setPendingPageId(pageId);
    startTransition(() => {
      router.push(`/workspace/${workspaceId}?page=${pageId}`);
    });
  }, [currentPageId, router, workspaceId]);

  const handleSelectWorkspace = (nextWorkspaceId: string) => {
    setIsWorkspaceMenuOpen(false);
    if (nextWorkspaceId === workspaceId) {
      return;
    }
    router.push(`/workspace/${nextWorkspaceId}`);
  };

  const handleCreatePage = async (type: PageType) => {
    const newPage = await createPage({
      title: createPageTitles[type],
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
    const deletedPageIds = new Set<string>();
    const queue = [pageId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (deletedPageIds.has(current)) continue;
      deletedPageIds.add(current);

      pages.forEach((page) => {
        if (page.parentId === current && !deletedPageIds.has(page.id)) {
          queue.push(page.id);
        }
      });
    }

    await deletePage(pageId);

    const deletionApplied = !usePageStore
      .getState()
      .pages.some((page) => page.id === pageId);

    if (deletionApplied && currentPageId && deletedPageIds.has(currentPageId)) {
      router.push(`/workspace/${workspaceId}`);
    }
  };

  const handleCreateChildPage = async (parentId: string, type: PageType) => {
    const newPage = await createPage({
      title: createPageTitles[type],
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

  const handleCreateFromSidebarMenu = async (type: PageType) => {
    const parentId = createMenuState?.parentId ?? null;

    if (parentId) {
      await handleCreateChildPage(parentId, type);
    } else {
      await handleCreatePage(type);
    }

    handleCloseCreateMenu();
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragPageId(String(event.active.id));
    setOverDragPageId(String(event.active.id));
    setDragOffsetX(0);
    handleCloseMenu();
    handleCloseCreateMenu();
  }, [handleCloseCreateMenu, handleCloseMenu]);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    setDragOffsetX(event.delta.x);
    if (event.over?.id) {
      setOverDragPageId(String(event.over.id));
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    const projection =
      overId && activeId !== overId
        ? getProjectedDropPosition(visiblePageTreeItems, activeId, overId, dragOffsetX)
        : null;

    setActiveDragPageId(null);
    setOverDragPageId(null);
    setDragOffsetX(0);

    if (!overId || !projection || activeId === overId) {
      return;
    }

    // 자기 자신의 하위 페이지로 이동하면 순환 참조가 생기므로 차단
    if (projection.parentId) {
      const activeNode = pageTreeMap.get(activeId);
      const descendantIds = new Set(activeNode ? collectDescendantIds(activeNode) : []);
      if (descendantIds.has(projection.parentId)) {
        return;
      }
    }

    const nextSiblingIds = getReorderedSiblingIds(
      visiblePageTreeItems,
      activeId,
      overId,
      projection
    );

    if (nextSiblingIds.length === 0) {
      await updatePage(activeId, {
        parentId: projection.parentId,
        order: 0,
      });
      return;
    }

    const updates = nextSiblingIds.map((pageId, index) =>
      updatePage(pageId, {
        parentId: projection.parentId,
        order: index * PAGE_ORDER_STEP,
      })
    );

    await Promise.all(updates);

    if (projection.parentId) {
      setExpandedPages((prev) => new Set(prev).add(projection.parentId as string));
    }
  }, [dragOffsetX, pageTreeMap, updatePage, visiblePageTreeItems]);

  const handleDragCancel = useCallback(() => {
    setActiveDragPageId(null);
    setOverDragPageId(null);
    setDragOffsetX(0);
  }, []);

  return (
    <>
      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        workspaceId={workspaceId}
      />
      <SearchDialog
        isOpen={isSearchOpen}
        query={searchQuery}
        mode={searchMode}
        isLoading={isSearchLoading}
        results={searchResults}
        error={searchError}
        onClose={handleCloseSearch}
        onQueryChange={setSearchQuery}
        onModeChange={setSearchMode}
        onSelectPage={handleSelectSearchResult}
      />

      {/* Sidebar */}
      <div
        className="relative flex h-full shrink-0 overflow-visible transition-[width] duration-200 ease-out"
        style={{ width: isSidebarHidden ? 0 : sidebarWidth }}
      >
        <aside
          data-testid="workspace-sidebar"
          className={`flex h-full overflow-hidden bg-[var(--color-surface)] transition-opacity duration-150 ${
            isSidebarHidden ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{
            width: isSidebarHidden ? 0 : sidebarWidth,
            borderRight: isSidebarHidden ? "none" : "1px solid var(--color-border)",
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Workspace Switcher */}
            <div className="relative px-2 py-2" ref={workspaceMenuRef}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsWorkspaceMenuOpen((open) => !open)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-left hover:bg-[var(--color-hover)]"
                >
                  <WorkspaceGlyph
                    icon={currentWorkspace?.icon ?? null}
                    image={currentWorkspaceOwnerImage}
                    label={currentWorkspace?.name ?? "Workspace"}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[var(--color-text-primary)]">
                      {currentWorkspace?.name ?? "Workspace"}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--color-text-secondary)]">
                      {currentWorkspace ? currentWorkspace.role.toLowerCase() : "loading"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform ${
                      isWorkspaceMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleHideSidebar}
                  className="shrink-0 rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                  aria-label="사이드바 숨기기"
                  title="사이드바 숨기기"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {isWorkspaceMenuOpen && (
                <div className="absolute left-2 right-2 top-full z-[99999] mt-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
                  {workspaces.map((workspace) => {
                    const isActiveWorkspace = workspace.id === workspaceId;
                    return (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => handleSelectWorkspace(workspace.id)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] ${
                          isActiveWorkspace
                            ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                        }`}
                      >
                        <WorkspaceGlyph
                          icon={workspace.icon}
                          image={workspace.ownerImage}
                          label={workspace.name}
                        />
                        <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                        {isActiveWorkspace ? (
                          <span className="text-[11px] font-medium text-[var(--color-accent)]">
                            현재
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-2 flex flex-col gap-0.5">
              <button
                type="button"
                onClick={handleOpenSearch}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
              >
                <Search className="w-4 h-4" />Search
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
              >
                <Settings className="w-4 h-4" />Settings
              </button>
              <ImportFromUrlControl
                workspaceId={workspaceId}
                onClose={() => setShowNewPageMenu(false)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                label="Crawler"
                icon={<AntGlyph className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />}
              />
              <div className="relative">
                <button
                  onClick={() => setShowNewPageMenu(!showNewPageMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px] w-full text-left"
                >
                  <Plus className="w-4 h-4" />New page
                </button>
                {showNewPageMenu && (
                  <div className="absolute top-full left-0 right-0 z-[99999] mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
                    {creatablePageTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleCreatePage(type)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition-colors"
                      >
                        {typeIcons[type]}
                        <span>{creatablePageLabels[type]}</span>
                      </button>
                    ))}
                    <div className="px-1 pb-1">
                      <ImportFromUrlControl
                        workspaceId={workspaceId}
                        onClose={() => setShowNewPageMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)]"
                      />
                    </div>
                  </div>
                )}
              </div>
              <Link
                href={`/workspace/${workspaceId}/graph${currentPageId ? `?page=${currentPageId}` : ""}`}
                data-testid="graph-view-link"
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
              >
                <Orbit className="w-4 h-4" />Graph View
              </Link>
            </div>

            {/* Files - Page Tree */}
            <div className="px-2 mt-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">Files</span>
                <button
                  ref={filesCreateButtonRef}
                  onClick={(e) => handleOpenCreateMenu(null, e.currentTarget)}
                  className="p-0.5 rounded hover:bg-[var(--color-hover)]"
                  title="페이지 추가"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--color-text-placeholder)]" />
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {showPageTreeSkeleton ? (
                  <PageTreeSkeleton />
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={(event) => void handleDragEnd(event)}
                    onDragCancel={handleDragCancel}
                  >
                    <SortableContext
                      items={visiblePageTreeItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {visiblePageTreeItems.map((item) => (
                        <SortablePageTreeItem
                          key={item.id}
                          page={item}
                          currentPageId={effectiveCurrentPageId}
                          activeAudience={pageAudienceById.get(item.id) ?? []}
                          onSelect={handleSelectPage}
                          onToggle={handleToggleExpand}
                          expanded={expandedPages}
                          onOpenCreateMenu={handleOpenCreateMenu}
                          onOpenMenu={handleOpenMenu}
                          projectedDepth={
                            item.id === activeDragPageId && projectedDrop
                              ? projectedDrop.depth
                              : undefined
                          }
                          isDragging={item.id === activeDragPageId}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Recent */}
            {showPageTreeSkeleton ? (
              <div className="border-t border-[var(--color-border)] px-2 py-2 shrink-0">
                <div className="px-2 py-1 text-[11px] font-medium text-[var(--color-text-placeholder)] uppercase tracking-wide">Recent</div>
                <RecentSkeleton />
              </div>
            ) : recentPages.length > 0 ? (
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
            ) : null}
          </div>
        </aside>

        {!isSidebarHidden ? (
          <button
            type="button"
            aria-label="사이드바 너비 조절"
            onMouseDown={handleSidebarResizeStart}
            className="absolute right-[-4px] top-0 z-20 h-full w-2 cursor-col-resize bg-transparent transition-colors hover:bg-[var(--color-hover)]"
          />
        ) : null}
      </div>

      {isSidebarHidden ? (
        <button
          type="button"
          onClick={handleShowSidebar}
          className="fixed left-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-sm ring-1 ring-[var(--color-border)] hover:bg-[var(--color-hover)]"
          aria-label="사이드바 열기"
          title="사이드바 열기"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
      
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
      {createMenuState && typeof document !== "undefined" && (
        <CreatePageMenuPortal
          position={createMenuState.position}
          workspaceId={workspaceId}
          parentId={createMenuState.parentId ?? null}
          onCreate={handleCreateFromSidebarMenu}
          onClose={handleCloseCreateMenu}
        />
      )}
    </>
  );
}

// 사이드바 페이지 트리 자리표시자 — 스토어가 채워질 때까지 표시.
// 들여쓰기/너비를 다양화해 실제 트리와 비슷한 윤곽을 잡는다.
function PageTreeSkeleton() {
  const rows = [
    { indent: 0, width: "70%" },
    { indent: 1, width: "55%" },
    { indent: 1, width: "60%" },
    { indent: 0, width: "75%" },
    { indent: 0, width: "50%" },
    { indent: 1, width: "45%" },
  ];
  return (
    <div
      className="flex flex-col gap-1 py-1 animate-pulse"
      aria-hidden="true"
      data-testid="page-tree-skeleton"
    >
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 py-1"
          style={{ paddingLeft: `${row.indent * 14 + 8}px`, paddingRight: "8px" }}
        >
          <div className="h-3 w-3 shrink-0 rounded-sm bg-[var(--color-hover)]" />
          <div className="h-3 w-3 shrink-0 rounded-sm bg-[var(--color-hover)]" />
          <div
            className="h-3 rounded bg-[var(--color-hover)]"
            style={{ width: row.width }}
          />
        </div>
      ))}
    </div>
  );
}

function RecentSkeleton() {
  return (
    <div className="flex flex-col gap-1 py-1 animate-pulse" aria-hidden="true">
      {["55%", "65%", "45%"].map((width, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-3.5 w-3.5 shrink-0 rounded-sm bg-[var(--color-hover)]" />
          <div className="h-3 rounded bg-[var(--color-hover)]" style={{ width }} />
        </div>
      ))}
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

interface CreatePageMenuPortalProps {
  position: { top: number; left: number };
  workspaceId: string;
  parentId: string | null;
  onCreate: (type: PageType) => void;
  onClose: () => void;
}

function CreatePageMenuPortal({
  position,
  workspaceId,
  parentId,
  onCreate,
  onClose,
}: CreatePageMenuPortalProps) {
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

  const adjustedPosition = { ...position };
  if (typeof window !== "undefined") {
    const menuWidth = 220;
    const menuHeight = 320;
    if (position.left + menuWidth > window.innerWidth) {
      adjustedPosition.left = window.innerWidth - menuWidth - 12;
    }
    if (position.top + menuHeight > window.innerHeight) {
      adjustedPosition.top = window.innerHeight - menuHeight - 12;
    }
  }

  const menuContent = (
    <div
      ref={menuRef}
      data-page-create-menu
      className="fixed min-w-[220px] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-lg"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 99999,
      }}
    >
      {creatablePageTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onCreate(type)}
          className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-hover)]"
        >
          <span className="mt-0.5 text-[var(--color-text-secondary)]">{typeIcons[type]}</span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-[var(--color-text-primary)]">
              {creatablePageLabels[type]}
            </span>
          </span>
        </button>
      ))}
      <div className="px-1 pb-1">
        <ImportFromUrlControl
          workspaceId={workspaceId}
          parentId={parentId}
          onClose={onClose}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-hover)]"
        />
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}
