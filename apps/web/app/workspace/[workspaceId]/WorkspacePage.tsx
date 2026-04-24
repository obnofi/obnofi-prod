"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ChevronRight,
  Settings,
  Plus,
  FileText,
  Palette,
  Clock,
  MoreHorizontal,
  Sparkles,
  Loader2,
  Database,
} from "lucide-react";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import { Page, PageType } from "@obnofi/types";
import { useUIStore } from "@/store/useUIStore";
import { PageTitleBlock } from "@/components/workspace/PageTitleBlock";

// Dynamically import heavy components
const Editor = dynamic(() => import("@/components/editor/Editor").then(mod => mod.Editor), {
  loading: () => <div className="flex h-[200px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>,
  ssr: false
});

const SharePopover = dynamic(() => import("@/components/share/SharePopover").then(mod => mod.SharePopover), {
  ssr: false
});

const ClearingBoard = dynamic(() => import("@/components/canvas/ClearingBoard").then(mod => mod.ClearingBoard), {
  loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>,
  ssr: false
});

const DatabaseWorkspace = dynamic(() => import("@/components/database/DatabaseWorkspace").then(mod => mod.DatabaseWorkspace), {
  loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>
});

const DatabaseViewModal = dynamic(() => import("@/components/database/DatabaseViewModal").then(mod => mod.DatabaseViewModal), {
  ssr: false
});

const GroveSideTab = dynamic(() => import("@/components/workspace/GroveSideTab").then(mod => mod.GroveSideTab), {
  ssr: false
});

interface WorkspacePageProps {
  workspaceId: string;
  pageId: string;
  initialPage?: Page;
  initialPages?: Page[];
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

export function WorkspacePage({ 
  workspaceId, 
  pageId,
  initialPage,
  initialPages
}: WorkspacePageProps) {
  const router = useRouter();
  const {
    currentPage,
    pages,
    fetchPage,
    fetchPages,
    updatePage,
    createPage,
    setCurrentPage,
    setPages,
    getPageTree,
  } = usePageStore();

  const openDatabaseModal = useUIStore((state) => state.openDatabaseModal);
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);
  const isDatabaseModalOpen = useUIStore((state) => state.databaseModal.isOpen);
  const isGroveSideTabOpen = useUIStore((state) => state.groveSideTab.isOpen);

  const [title, setTitle] = useState(initialPage?.title || "");
  const [isLoading, setIsLoading] = useState(!initialPage);
  const [pendingChildType, setPendingChildType] = useState<PageType | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  // Initialize store with pre-fetched data
  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
    if (initialPages) {
      setPages(initialPages);
    }
  }, [initialPage, initialPages, setCurrentPage, setPages]);

  useEffect(() => {
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  useEffect(() => {
    const loadPage = async () => {
      // If we don't have initialPage or the pageId changed, we need to fetch
      if (!initialPage || currentPage?.id !== pageId) {
        setIsLoading(true);
        await fetchPage(pageId);
        setIsLoading(false);
      }
    };
    loadPage();
  }, [pageId, fetchPage, initialPage, currentPage?.id]);

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title);
    }
  }, [currentPage]);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    await updatePage(pageId, { title: newTitle });
  };

  const handleContentUpdate = async (content: object) => {
    await updatePage(pageId, { content });
  };

  const handleToggleExpand = (pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSelectPage = (selectedPageId: string) => {
    router.push(`/workspace/${workspaceId}?page=${selectedPageId}`);
  };

  const handleOpenDatabaseModal = (databaseId: string | null | undefined, title: string) => {
    if (databaseId) {
      openDatabaseModal(databaseId, title);
    }
  };

  useEffect(() => {
    const handleShareUpdate = (e: Event) => {
      const { isPublic, shareId } = (e as CustomEvent).detail;
      if (currentPage) {
        setCurrentPage({ ...currentPage, isPublic, shareId });
      }
    };
    window.addEventListener("share-update", handleShareUpdate);
    return () => window.removeEventListener("share-update", handleShareUpdate);
  }, [currentPage, setCurrentPage]);

  useEffect(() => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      next.add(pageId);

      let page = pages.find((item) => item.id === pageId);
      while (page?.parentId) {
        next.add(page.parentId);
        page = pages.find((item) => item.id === page?.parentId);
      }

      return next;
    });
  }, [pageId, pages]);

  const handleCreateChildPage = async (type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Clearing",
      database: "New Database",
    };

    setPendingChildType(type);

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId: pageId,
      workspaceId,
    });

    setPendingChildType(null);

    if (newPage) {
      openGrovePageSideTab(newPage.id, workspaceId);
    }
  };

  // Get recent pages
  const recentPages = [...pages]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  // Get page tree
  const pageTree = getPageTree();
  const pageTrail = useMemo(() => {
    if (!currentPage) {
      return [];
    }

    const trail = [currentPage];
    const visited = new Set<string>([currentPage.id]);
    let parentId = currentPage.parentId;

    while (parentId && !visited.has(parentId)) {
      const parent = pages.find((page) => page.id === parentId);
      if (!parent) {
        break;
      }

      trail.unshift(parent);
      visited.add(parent.id);
      parentId = parent.parentId;
    }

    return trail;
  }, [currentPage, pages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-background)]">
        Page not found
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <header className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0 bg-[var(--color-background)]">
        <div className="flex min-w-0 items-center gap-1 text-[14px]">
          {pageTrail.map((page, index) => {
            const isCurrent = page.id === currentPage.id;

            return (
              <span key={page.id} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-placeholder)]" />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (!isCurrent) {
                      handleSelectPage(page.id);
                    }
                  }}
                  disabled={isCurrent}
                  className={`inline-flex min-w-0 max-w-[180px] items-center gap-1.5 rounded px-1.5 py-1 transition ${
                    isCurrent
                      ? "cursor-default text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                  title={page.title || "Untitled"}
                >
                  <span className="shrink-0 text-[var(--color-text-secondary)]">
                    {page.icon ? <span>{page.icon}</span> : typeIcons[page.type]}
                  </span>
                  <span className="truncate">{page.title || "Untitled"}</span>
                </button>
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <SharePopover pageId={pageId} isPublic={currentPage.isPublic} shareId={currentPage.shareId} onShareUpdateAction="share-update" />
          <button className="p-2 hover:bg-[var(--color-hover)] rounded"><Settings className="w-4 h-4 text-[var(--color-text-secondary)]" /></button>
          <button className="p-2 hover:bg-[var(--color-hover)] rounded"><Sparkles className="w-4 h-4 text-[var(--color-text-secondary)]" /></button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[var(--color-background)]">
        {currentPage.type === "document" && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-12 py-8">
              {/* Title */}
              <PageTitleBlock
                value={title}
                onChange={(nextTitle) => void handleTitleChange(nextTitle)}
                placeholder="Untitled"
                size="page"
                testId="workspace-page-title"
              />

              {/* Mobile Add Buttons */}
              <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:hidden">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  <Plus className="h-3.5 w-3.5" />Add to doc
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "database" as const, label: "Database", description: "Table with rows", icon: <Database className="h-4 w-4" /> },
                  ].map((action) => {
                    const isPending = pendingChildType === action.type;
                    return (
                      <button
                        key={action.type}
                        type="button"
                        onClick={() => void handleCreateChildPage(action.type)}
                        disabled={pendingChildType !== null}
                        className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left transition hover:border-[#2E7D45] hover:bg-[var(--color-accent-subtle)] disabled:cursor-wait disabled:opacity-60"
                      >
                        <div className="flex w-full items-center justify-between text-[#2E7D45]">
                          <span className="rounded-lg bg-[#E8F3EC] p-2">{action.icon}</span>
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text-primary)]">{action.label}</div>
                          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{action.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editor */}
              <Editor
                key={pageId}
                content={currentPage.content}
                editable={true}
                onUpdate={handleContentUpdate}
                placeholder="Type something..."
                workspaceId={workspaceId}
                pageId={pageId}
              />
            </div>
          </div>
        )}

        {currentPage.type === "canvas" && (
          <div className="h-full">
            <ClearingBoard
              embedded={true}
              roomSlug={currentPage.id}
              title={currentPage.title || "Jungle Clearing"}
            />
          </div>
        )}

        {currentPage.type === "database" && (
          <DatabaseWorkspace pageId={pageId} workspaceId={workspaceId} />
        )}
      </div>

      {/* Database View Modal - available on all pages */}
      {isDatabaseModalOpen && <DatabaseViewModal />}
      {isGroveSideTabOpen && <GroveSideTab workspaceId={workspaceId} />}
    </>
  );
}
