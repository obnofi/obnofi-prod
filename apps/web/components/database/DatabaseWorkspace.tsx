"use client";

import { DatabasePageCard } from "@/components/database/DatabasePageCard";
import { useUIStore } from "@/store/useUIStore";

interface DatabaseWorkspaceProps {
  pageId: string;
  workspaceId: string;
}

export function DatabaseWorkspace({ pageId, workspaceId }: DatabaseWorkspaceProps) {
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] px-12 pb-6 pt-8">
      <div className="flex-1 overflow-hidden">
        <DatabasePageCard
          pageId={pageId}
          containerTestId="workspace-database"
          loadingTestId="workspace-database-loading"
          readyTestId="workspace-database-ready"
          emptyTestId="workspace-database-empty"
          onOpenRow={(rowId) => openGrovePageSideTab(rowId, workspaceId)}
          emptyMessage="Database not found"
          compact={true}
          maxContentHeightClass="h-full"
          editableTitle={true}
        />
      </div>
    </div>
  );
}
