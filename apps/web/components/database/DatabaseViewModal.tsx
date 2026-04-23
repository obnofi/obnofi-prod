"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Database } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { DatabasePage } from "@obnofi/types";
import { ViewTabs } from "./ViewTabs";

export function DatabaseViewModal() {
  const { databaseModal, closeDatabaseModal, openGrovePageSideTab } = useUIStore();
  const { isOpen, databaseId, pageTitle } = databaseModal;
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
    if (isOpen && databaseId) {
      void loadDatabase();
    }
  }, [isOpen, databaseId, loadDatabase]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDatabaseModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeDatabaseModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeDatabaseModal}
      />

      {/* Modal */}
      <div className="relative flex h-[85vh] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2E7D45]/10">
              <Database className="h-5 w-5 text-[#2E7D45]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111110] dark:text-zinc-100">
                {databasePage?.title || pageTitle || "Untitled Database"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {databasePage?.database.rows.length || 0} rows
                {databasePage?.database.properties.length
                  ? ` · ${databasePage.database.properties.length} properties`
                  : ""}
              </p>
            </div>
          </div>
          <button
            onClick={closeDatabaseModal}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#2E7D45]" />
            </div>
          ) : databasePage ? (
            <ViewTabs
              databasePage={databasePage}
              onDatabaseChange={setDatabasePage}
              onOpenRow={(rowId) =>
                openGrovePageSideTab(rowId, databasePage.workspaceId)
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
              Failed to load database
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
