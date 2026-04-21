"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { DatabasePage } from "@/types";
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

  const loadDatabase = useCallback(async () => {
    if (!databaseId) return;

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
        content: null,
        type: "database",
        parentId: null,
        workspaceId: "",
        createdAt: "",
        updatedAt: "",
        isPublic: false,
        shareId: null,
        sharePassword: null,
        database: data,
      });
    } catch (error) {
      console.error("Failed to load database:", error);
    } finally {
      setIsLoading(false);
    }
  }, [databaseId, pageTitle]);

  useEffect(() => {
    void loadDatabase();
  }, [loadDatabase]);

  if (isLoading) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-white ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
      </div>
    );
  }

  if (!databasePage) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 ${className}`}
      >
        Failed to load database
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D45]/10">
          <Database className="h-4 w-4 text-[#2E7D45]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#111110]">
            {databasePage.title || pageTitle || "Untitled Database"}
          </h3>
          <p className="text-xs text-zinc-500">
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
