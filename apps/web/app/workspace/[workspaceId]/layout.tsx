"use client";

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
} from "lucide-react";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import {
  creatablePageDescriptions,
  creatablePageLabels,
  creatablePageTypes,
  createPageTitles,
} from "@/lib/pageCreation";
import { Page, PageType } from "@obnofi/types";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  ownerId: string;
  role: "OWNER" | "EDITOR" | "VIEWER" | "MEMBER";
  createdAt: string;
  updatedAt: string;
}

function WorkspaceGlyph({ icon, label }: { icon: string | null; label: string }) {
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
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  expanded: Set<string>;
  onOpenCreateMenu: (parentId: string | null, buttonEl: HTMLButtonElement) => void;
  onOpenMenu: (nodeId: string, buttonEl: HTMLButtonElement) => void;
  projectedDepth?: number;
  isDragging?: boolean;
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
        className={`group flex items-center gap-1.5 py-1 rounded transition-colors ${
          isActive
            ? "bg-[var(--color-selected)] text-[var(--color-text-primary)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
        } ${isDragging ? "opacity-60" : ""}`}
        style={{ paddingLeft: `${depth * PAGE_TREE_INDENT + 8}px`, paddingRight: "8px" }}
        onClick={() => onSelect(page.id)}
      >
        <span
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab rounded p-0.5 text-[var(--color-text-placeholder)] hover:bg-[var(--color-hover)] active:cursor-grabbing"
          title="드래그해서 순서 및 위계 변경"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (page.hasChildren) onToggle(page.id);
          }}
          className={`p-0.5 rounded transition-transform shrink-0 ${
            page.hasChildren ? "opacity-100" : "opacity-0"
          } ${isExpanded ? "rotate-90" : ""}`}
        >
          <ChevronDown className="w-3 h-3 text-[var(--color-text-secondary)]" />
        </button>
        <span className="text-[var(--color-text-secondary)] shrink-0">
          {page.icon || typeIcons[page.type]}
        </span>
        <span className="flex-1 text-[13px] truncate">{page.title || "Untitled"}</span>
        
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

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <Suspense fallback={null}>
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
    </Suspense>
  );
}

function WorkspaceLayoutInner({ children }: WorkspaceLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeDragPageId, setActiveDragPageId] = useState<string | null>(null);
  const [overDragPageId, setOverDragPageId] = useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
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

  const { pages, fetchPages, getPageTree, createPage, updatePage, deletePage } = usePageStore();
  const initializedWorkspaceId = usePageStore((state) => state.initializedWorkspaceId);
  const searchParams = useSearchParams();
  const currentPageId = searchParams.get("page") ?? undefined;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );
  // SSR(WorkspacePage가 setPages로 채움) 또는 fetch가 끝나면 false. 그 전엔 트리 자리에 스켈레톤 표시.
  const showPageTreeSkeleton = initializedWorkspaceId !== workspaceId;
  
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
      const next = new Set(prev);
      let page = pages.find((p) => p.id === currentPageId);
      while (page?.parentId) {
        next.add(page.parentId);
        page = pages.find((p) => p.id === page?.parentId);
      }
      return next;
    });
  }, [currentPageId, pages]);

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
  const isOwnedWorkspace = currentWorkspace?.ownerId === session?.user?.id;

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
    await deletePage(pageId);
    if (currentPageId === pageId) {
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
  }, [dragOffsetX, updatePage, visiblePageTreeItems]);

  const handleDragCancel = useCallback(() => {
    setActiveDragPageId(null);
    setOverDragPageId(null);
    setDragOffsetX(0);
  }, []);

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        workspaceId={workspaceId}
      />

      {/* Sidebar */}
      <aside className="w-60 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden">
        {/* Workspace Switcher */}
        <div className="relative px-2 py-2" ref={workspaceMenuRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen((open) => !open)}
            className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left hover:bg-[var(--color-hover)]"
          >
            {isOwnedWorkspace ? (
              <UserAvatar size={22} shape="square" className="shrink-0" />
            ) : (
              <WorkspaceGlyph
                icon={currentWorkspace?.icon ?? null}
                label={currentWorkspace?.name ?? "Workspace"}
              />
            )}
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
                    <WorkspaceGlyph icon={workspace.icon} label={workspace.name} />
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
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]">
            <Search className="w-4 h-4" />Search
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] text-[13px]"
          >
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
                      currentPageId={currentPageId}
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
      {createMenuState && typeof document !== "undefined" && (
        <CreatePageMenuPortal
          position={createMenuState.position}
          onCreate={handleCreateFromSidebarMenu}
          onClose={handleCloseCreateMenu}
        />
      )}
    </div>
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
  onCreate: (type: PageType) => void;
  onClose: () => void;
}

function CreatePageMenuPortal({ position, onCreate, onClose }: CreatePageMenuPortalProps) {
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
    const menuHeight = 200;
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
            <span className="block text-[12px] text-[var(--color-text-secondary)]">
              {creatablePageDescriptions[type]}
            </span>
          </span>
        </button>
      ))}
    </div>
  );

  return createPortal(menuContent, document.body);
}
