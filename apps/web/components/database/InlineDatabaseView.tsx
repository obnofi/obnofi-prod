"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Database, Loader2, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { DatabasePage } from "@obnofi/types";
import { ViewTabs } from "./ViewTabs";

interface InlineDatabaseViewProps {
  databaseId: string;
  pageTitle?: string;
  className?: string;
}

export function InlineDatabaseView({
  databaseId,
  pageTitle,
  className = "",
}: InlineDatabaseViewProps) {
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);
  const [databasePage, setDatabasePage] = useState<DatabasePage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasLoaded = useRef(false);

  const loadDatabase = useCallback(async () => {
    if (!databaseId || hasLoaded.current) return;

    hasLoaded.current = true;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/databases/${databaseId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch database");
      }
      const data = (await response.json()) as DatabasePage["database"];

      // Fetch the page info for the database
      const pageResponse = await fetch(`/api/databases/${databaseId}/page`);
      let pageData = { title: pageTitle || "Untitled" };
      if (pageResponse.ok) {
        pageData = await pageResponse.json();
      }

      setDatabasePage({
        id: databaseId,
        title: pageData.title,
        groveTitleLevel: 1,
        bodyFontSizePt: 12,
        headingFontSizes: { h1: 30, h2: 23, h3: 18, h4: 16, h5: 14 },
        highlightColors: ["yellow", "green", "blue", "pink"],
        content: null,
        type: "database",
        parentId: null,
        order: 0,
        workspaceId: "",
        createdAt: "",
        updatedAt: "",
        isPublic: false,
        shareId: null,
        sharePassword: null,
        collaborationEnabled: false,
        lineIndicatorEnabled: false,
        database: data,
      });
    } catch (error) {
      console.error("Failed to load database:", error);
      hasLoaded.current = false; // 실패 시 재시도 가능하도록
    } finally {
      setIsLoading(false);
    }
  }, [databaseId, pageTitle]);

  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (!hasLoaded.current) {
        void loadDatabase();
      }
    }
  }, [isExpanded, loadDatabase]);

  // 접힌 상태 - 클릭하면 펼쳐짐
  if (!isExpanded) {
    return (
      <div
        onClick={handleExpand}
        className={`cursor-pointer overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-hover)] transition-colors ${className}`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D45]/10">
            <Database className="h-4 w-4 text-[#2E7D45]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {pageTitle || "Untitled Database"}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Click to load database
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--color-text-secondary)]" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
      </div>
    );
  }

  if (!databasePage) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] ${className}`}
      >
        Failed to load database
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D45]/10">
          <Database className="h-4 w-4 text-[#2E7D45]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {databasePage.title || pageTitle || "Untitled Database"}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {databasePage.database.rows.length || 0} rows
            {databasePage.database.properties.length
              ? ` · ${databasePage.database.properties.length} properties`
              : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: "300px" }}>
        <ViewTabs
          databasePage={databasePage}
          onDatabaseChange={setDatabasePage}
          onOpenRow={(rowId) =>
            openGrovePageSideTab(rowId, databasePage.workspaceId)
          }
        />
      </div>
    </div>
  );
}
