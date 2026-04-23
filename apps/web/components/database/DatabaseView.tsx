"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Page, PageType } from "@obnofi/types";

interface DatabaseViewProps {
  databasePage: Page;
  childPages: Page[];
  onCreateChildAction: string;
  onSelectChildAction: string;
}

type ViewMode = "table" | "grid";
type SortField = "title" | "type" | "updatedAt";
type SortDirection = "asc" | "desc";

const typeIcons: Record<PageType, string> = {
  document: "📄",
  canvas: "🎨",
  database: "🗄️",
};

const typeLabels: Record<PageType, string> = {
  document: "Document",
  canvas: "Canvas",
  database: "Database",
};

export function DatabaseView({
  databasePage,
  childPages,
  onCreateChildAction,
  onSelectChildAction,
}: DatabaseViewProps) {
  const handleCreateChild = (type: PageType) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent(onCreateChildAction, { detail: type });
      window.dispatchEvent(event);
    }
  };

  const handleSelectChild = (pageId: string) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent(onSelectChildAction, { detail: pageId });
      window.dispatchEvent(event);
    }
  };
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showNewMenu, setShowNewMenu] = useState(false);

  const filteredAndSortedPages = useMemo(() => {
    let result = [...childPages];

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "updatedAt":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [childPages, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none placeholder:text-zinc-400 text-[#111110] dark:text-zinc-100 w-40"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Button */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#2E7D45] hover:bg-[#256a3a] rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>

          {showNewMenu && (
            <div className="absolute top-full right-0 z-[99999] mt-1 w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              {(["document", "canvas", "database"] as PageType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleCreateChild(type);
                      setShowNewMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <span>{typeIcons[type]}</span>
                    {typeLabels[type]}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
              <tr>
                <th
                  className="px-4 py-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortField === "title" && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 w-32"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {sortField === "type" && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 w-40"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center gap-1">
                    Last Edited
                    {sortField === "updatedAt" && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPages.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-zinc-400 dark:text-zinc-600"
                  >
                    {searchQuery
                      ? "No pages match your search"
                      : "No pages in this database"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedPages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectChild(page.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {page.icon || typeIcons[page.type]}
                        </span>
                        <span className="text-sm text-[#111110] dark:text-zinc-100">
                          {page.title || "Untitled"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {typeLabels[page.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(page.updatedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {filteredAndSortedPages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
              {searchQuery
                ? "No pages match your search"
                : "No pages in this database"}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAndSortedPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => handleSelectChild(page.id)}
                  className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-[#2E7D45] dark:hover:border-[#2E7D45] cursor-pointer transition-colors group"
                >
                  <div className="text-3xl mb-3">
                    {page.icon || typeIcons[page.type]}
                  </div>
                  <h3 className="font-medium text-[#111110] dark:text-zinc-100 mb-1 truncate">
                    {page.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {typeLabels[page.type]} • {formatDate(page.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
