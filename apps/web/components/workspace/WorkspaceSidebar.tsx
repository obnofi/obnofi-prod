"use client";

import { ChevronRight } from "lucide-react";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { SearchDialog } from "@/components/workspace/SidebarSearchDialog";
import { SidebarWorkspaceSwitcher } from "@/components/workspace/SidebarWorkspaceSwitcher";
import { SidebarQuickActions } from "@/components/workspace/SidebarQuickActions";
import { SidebarPageTree } from "@/components/workspace/SidebarPageTree";
import { PageTreeMenuPortal, CreatePageMenuPortal } from "@/components/workspace/PageTreeMenuPortals";
import { useWorkspaceSidebar } from "@/hooks/useWorkspaceSidebar";

interface WorkspaceSidebarProps {
  workspaceId: string;
}

export function WorkspaceSidebar({ workspaceId }: WorkspaceSidebarProps) {
  const {
    showNewPageMenu,
    setShowNewPageMenu,
    isWorkspaceMenuOpen,
    setIsWorkspaceMenuOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    createMenuState,
    activeMenuNodeId,
    menuPosition,
    filesCreateButtonRef,
    workspaceMenuRef,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    searchResults,
    isSearchLoading,
    searchError,
    handleOpenSearch,
    handleCloseSearch,
    handleSelectSearchResult,
    currentPageId,
    effectiveCurrentPageId,
    pageAudienceById,
    showPageTreeSkeleton,
    recentPages,
    currentWorkspace,
    currentWorkspaceOwnerImage,
    workspaces,
    expandedPages,
    sidebarWidth,
    isSidebarHidden,
    handleToggleExpand,
    handleSelectPage,
    handleDeletePage,
    activeDragPageId,
    sensors,
    projectedDrop,
    visiblePageTreeItems,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    handleOpenMenu,
    handleCloseMenu,
    handleOpenCreateMenu,
    handleCloseCreateMenu,
    handleHideSidebar,
    handleShowSidebar,
    handleSidebarResizeStart,
    handleCreatePage,
    handleCreateFromSidebarMenu,
    handleSelectWorkspace,
  } = useWorkspaceSidebar(workspaceId);

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

      {/* Sidebar container */}
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
            <SidebarWorkspaceSwitcher
              workspaceId={workspaceId}
              currentWorkspace={currentWorkspace}
              currentWorkspaceOwnerImage={currentWorkspaceOwnerImage}
              workspaces={workspaces}
              isWorkspaceMenuOpen={isWorkspaceMenuOpen}
              onToggleMenu={() => setIsWorkspaceMenuOpen((open) => !open)}
              onSelectWorkspace={handleSelectWorkspace}
              onHideSidebar={handleHideSidebar}
              workspaceMenuRef={workspaceMenuRef}
            />

            <SidebarQuickActions
              workspaceId={workspaceId}
              currentPageId={currentPageId}
              showNewPageMenu={showNewPageMenu}
              onToggleNewPageMenu={() => setShowNewPageMenu(!showNewPageMenu)}
              onOpenSearch={handleOpenSearch}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onCreatePage={handleCreatePage}
              onCloseNewPageMenu={() => setShowNewPageMenu(false)}
            />

            <SidebarPageTree
              workspaceId={workspaceId}
              showPageTreeSkeleton={showPageTreeSkeleton}
              visiblePageTreeItems={visiblePageTreeItems}
              effectiveCurrentPageId={effectiveCurrentPageId}
              pageAudienceById={pageAudienceById}
              expandedPages={expandedPages}
              activeDragPageId={activeDragPageId}
              projectedDrop={projectedDrop}
              recentPages={recentPages}
              sensors={sensors}
              filesCreateButtonRef={filesCreateButtonRef}
              onToggleExpand={handleToggleExpand}
              onSelectPage={handleSelectPage}
              onOpenCreateMenu={handleOpenCreateMenu}
              onOpenMenu={handleOpenMenu}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            />
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

      {/* Portals */}
      {activeMenuNodeId && typeof document !== "undefined" && (
        <PageTreeMenuPortal
          position={menuPosition}
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
    </>
  );
}
