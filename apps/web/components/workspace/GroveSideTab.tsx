"use client";

import { ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import { DatabasePageCard } from "@/components/database/DatabasePageCard";
import { Editor } from "@/components/editor/Editor";
import { CollaborationProvider } from "@/lib/collaboration/CollaborationContext";
import { useUIStore } from "@/store/useUIStore";
import { PageTitleBlock } from "@/components/workspace/PageTitleBlock";
import { GroveRowProperties } from "@/components/workspace/GroveRowProperties";
import { TaskSideTabContent } from "@/components/workspace/TaskSideTabContent";
import { useGroveSideTabPage } from "@/hooks/useGroveSideTabPage";

const emptyDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function GroveSideTab({ workspaceId }: { workspaceId: string }) {
  const { groveSideTab, closeGroveSideTab, toggleGroveSideTabFullscreen } =
    useUIStore();
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);

  const content = groveSideTab.content;
  const pageId = content?.kind === "page" ? content.pageId : null;
  const activeWorkspaceId =
    content?.kind === "page" ? content.workspaceId ?? workspaceId : workspaceId;

  const {
    page,
    database,
    rowPropertyValues,
    isLoadingPage,
    ancestors,
    handlePageTitleChange,
    handlePageContentUpdate,
    handlePropertyValueChange,
  } = useGroveSideTabPage(pageId, groveSideTab.isOpen);

  if (!groveSideTab.isOpen || !content) {
    return null;
  }

  const isFullscreen = groveSideTab.isFullscreen;
  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest("[data-grove-side-tab-panel='true']") ||
      target.closest("[data-grove-dropdown-portal='true']")
    ) {
      return;
    }

    closeGroveSideTab();
  };

  return (
    <div
      className={`fixed inset-0 z-[100000] ${isFullscreen ? "bg-black/40" : "bg-black/10"}`}
      onMouseDown={handleBackdropMouseDown}
    >
      <aside
        data-grove-side-tab-panel="true"
        className={`absolute right-0 top-0 flex h-full flex-col border-l border-[var(--color-border)] shadow-2xl transition-all ${
          isFullscreen
            ? "w-full !max-w-none bg-[var(--color-surface)]"
            : "w-full max-w-[680px] bg-[var(--color-background)]"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
          <div className="min-w-0 truncate text-sm font-medium text-[var(--color-text-primary)]">
            {content.kind === "page"
              ? page?.title || "Untitled"
              : content.task.name}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleGroveSideTabFullscreen}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              aria-label={isFullscreen ? "전체화면 닫기" : "전체화면"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={closeGroveSideTab}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              aria-label="사이드탭 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {content.kind === "page" ? (
            <div className="mx-auto max-w-3xl">
              {isLoadingPage ? (
                <div className="py-16 text-sm text-[var(--color-text-secondary)]">
                  페이지를 불러오는 중...
                </div>
              ) : page ? (
                <>
                  {ancestors.length > 0 && (
                    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
                      {ancestors.map((ancestor) => (
                        <span key={ancestor.id} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              openGrovePageSideTab(ancestor.id, activeWorkspaceId ?? workspaceId);
                            }}
                            className="inline-flex max-w-[150px] items-center gap-1 truncate rounded px-1 py-0.5 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                            title={ancestor.title}
                          >
                            {ancestor.icon && <span className="text-xs">{ancestor.icon}</span>}
                            <span className="truncate">{ancestor.title || "Untitled"}</span>
                          </button>
                          <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                        </span>
                      ))}
                    </nav>
                  )}
                  <PageTitleBlock
                    value={page.title}
                    onChange={(nextTitle) => void handlePageTitleChange(nextTitle)}
                    commitOnBlur={Boolean(database || page.parentDatabaseId || page.type === "database")}
                    placeholder="Untitled"
                    size="side-tab"
                  />
                  {page.type === "database" ? (
                    <DatabasePageCard
                      pageId={page.id}
                      containerTestId="side-tab-database"
                      loadingTestId="side-tab-database-loading"
                      readyTestId="side-tab-database-ready"
                      emptyTestId="side-tab-database-empty"
                      onOpenRow={(rowId) =>
                        openGrovePageSideTab(rowId, activeWorkspaceId ?? workspaceId)
                      }
                      emptyMessage="Database not found"
                      compact={true}
                      jungleLimit={500}
                      maxContentHeightClass="h-[70vh]"
                      editableTitle={false}
                    />
                  ) : database ? (
                    <GroveRowProperties
                      properties={database.properties}
                      values={rowPropertyValues}
                      onChange={handlePropertyValueChange}
                    />
                  ) : null}
                  {page.type !== "database" ? (
                    <CollaborationProvider
                      key={page.id}
                      pageId={page.id}
                      active={page.type === "document"}
                    >
                      <Editor
                        content={page.content ?? emptyDoc}
                        bodyFontSizePt={page.bodyFontSizePt}
                        headingFontSizes={page.headingFontSizes}
                        highlightColors={page.highlightColors}
                        onUpdate={handlePageContentUpdate}
                        workspaceId={activeWorkspaceId ?? workspaceId}
                        pageId={page.id}
                        placeholder="페이지 내용을 입력하세요..."
                      />
                    </CollaborationProvider>
                  ) : null}
                </>
              ) : (
                <div className="py-16 text-sm text-[var(--color-text-secondary)]">
                  페이지를 찾을 수 없습니다.
                </div>
              )}
            </div>
          ) : (
            <TaskSideTabContent task={content.task} />
          )}
        </div>
      </aside>
    </div>
  );
}
