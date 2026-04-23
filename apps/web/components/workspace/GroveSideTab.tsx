"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Maximize2, Minimize2, Tag, X } from "lucide-react";
import { DatabasePageCard } from "@/components/database/DatabasePageCard";
import { PropertyCell } from "@/components/database/PropertyCell";
import { Editor } from "@/components/editor/Editor";
import { patchGroveCell } from "@/lib/groveCatalogApi";
import { useGroveCatalogStore } from "@/store/useGroveCatalogStore";
import { usePageStore } from "@/store/pageStore";
import { useUIStore } from "@/store/useUIStore";
import type { Database, Page, Property, PropertyValue, PropertyValueData } from "@obnofi/types";

interface SideTabTask {
  id: string;
  name: string;
  status: string;
  tags?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  coverUrl?: string;
}

interface AncestorPage {
  id: string;
  title: string;
  icon?: string | null;
}

const emptyDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function GroveSideTab({ workspaceId }: { workspaceId: string }) {
  const { groveSideTab, closeGroveSideTab, toggleGroveSideTabFullscreen } =
    useUIStore();
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);
  const updatePage = usePageStore((state) => state.updatePage);
  const patchGroveCellValue = useGroveCatalogStore(
    (state) => state.patchGroveCellValue
  );
  const [page, setPage] = useState<Page | null>(null);
  const [database, setDatabase] = useState<Database | null>(null);
  const [rowPropertyValues, setRowPropertyValues] = useState<PropertyValue[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [ancestors, setAncestors] = useState<AncestorPage[]>([]);

  const content = groveSideTab.content;
  const pageId = content?.kind === "page" ? content.pageId : null;
  const activeWorkspaceId =
    content?.kind === "page" ? content.workspaceId ?? workspaceId : workspaceId;

  useEffect(() => {
    if (!groveSideTab.isOpen || !pageId) {
      setPage(null);
      setDatabase(null);
      setRowPropertyValues([]);
      return;
    }

    let isActive = true;
    setIsLoadingPage(true);

    // Fetch page and ancestors in parallel
    Promise.all([
      fetch(`/api/pages/${pageId}`),
      fetch(`/api/pages/${pageId}/ancestors`),
    ])
      .then(async ([pageResponse, ancestorsResponse]) => {
        if (!isActive) {
          return;
        }

        const nextPage = pageResponse.ok ? ((await pageResponse.json()) as Page | null) : null;
        const ancestorsData = ancestorsResponse.ok ? ((await ancestorsResponse.json()) as AncestorPage[]) : [];

        setPage(nextPage);
        setAncestors(ancestorsData);
        setDatabase(null);
        setRowPropertyValues(nextPage?.propertyValues ?? []);

        if (nextPage?.parentDatabaseId) {
          const databaseResponse = await fetch(
            `/api/databases/${nextPage.parentDatabaseId}`
          );
          if (!isActive || !databaseResponse.ok) {
            return;
          }

          const nextDatabase = (await databaseResponse.json()) as Database;
          const nextRow = nextDatabase.rows.find((row) => row.id === nextPage.id);
          setDatabase(nextDatabase);
          setRowPropertyValues(nextRow?.propertyValues ?? []);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPage(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [groveSideTab.isOpen, pageId]);

  const handlePageTitleChange = async (title: string) => {
    if (!page) {
      return;
    }

    setPage({ ...page, title });
    await updatePage(page.id, { title });
    const latestPage = usePageStore.getState().pages.find((item) => item.id === page.id);
    setPage(latestPage ?? { ...page, title });
  };

  const handlePageContentUpdate = async (nextContent: object) => {
    if (!page) {
      return;
    }

    await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: nextContent }),
    });
  };

  const handlePropertyValueChange = async (
    propertyId: string,
    value: PropertyValueData
  ) => {
    if (!page || !database) {
      return;
    }

    const optimisticValue: PropertyValue = {
      id: `side-tab:${page.id}:${propertyId}`,
      pageId: page.id,
      propertyId,
      columnId: propertyId,
      value,
    };

    setRowPropertyValues((current) => {
      const existingIndex = current.findIndex(
        (propertyValue) =>
          propertyValue.propertyId === propertyId ||
          propertyValue.columnId === propertyId
      );

      if (existingIndex === -1) {
        return [...current, optimisticValue];
      }

      return current.map((propertyValue, index) =>
        index === existingIndex
          ? { ...propertyValue, value }
          : propertyValue
      );
    });
    patchGroveCellValue(database.pageId, page.id, propertyId, value);

    try {
      const savedValue = await patchGroveCell(page.id, propertyId, value);
      if (savedValue) {
        setRowPropertyValues((current) => {
          const existingIndex = current.findIndex(
            (propertyValue) =>
              propertyValue.propertyId === propertyId ||
              propertyValue.columnId === propertyId
          );

          if (existingIndex === -1) {
            return [...current, savedValue];
          }

          return current.map((propertyValue, index) =>
            index === existingIndex ? savedValue : propertyValue
          );
        });
        patchGroveCellValue(database.pageId, page.id, propertyId, savedValue);
      }
    } catch {
      const databaseResponse = await fetch(`/api/databases/${database.id}`);
      if (databaseResponse.ok) {
        const nextDatabase = (await databaseResponse.json()) as Database;
        const nextRow = nextDatabase.rows.find((row) => row.id === page.id);
        setDatabase(nextDatabase);
        setRowPropertyValues(nextRow?.propertyValues ?? []);
      }
    }
  };

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
                  {/* Breadcrumb */}
                  {ancestors.length > 0 && (
                    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
                      {ancestors.map((ancestor, index) => (
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
                  <input
                    type="text"
                    value={page.title}
                    onChange={(event) => void handlePageTitleChange(event.target.value)}
                    placeholder="Untitled"
                    className="mb-6 w-full border-none bg-transparent text-[34px] font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
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
                    <Editor
                      content={page.content ?? emptyDoc}
                      onUpdate={handlePageContentUpdate}
                      workspaceId={activeWorkspaceId ?? workspaceId}
                      pageId={page.id}
                      placeholder="페이지 내용을 입력하세요..."
                    />
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

function GroveRowProperties({
  properties,
  values,
  onChange,
}: {
  properties: Property[];
  values: PropertyValue[];
  onChange: (propertyId: string, value: PropertyValueData) => void;
}) {
  if (properties.length === 0) {
    return null;
  }

  const getValue = (propertyId: string) =>
    values.find(
      (propertyValue) =>
        propertyValue.propertyId === propertyId ||
        propertyValue.columnId === propertyId
    )?.value;

  return (
    <section className="mb-8">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
        속성
      </div>
      <div>
        {properties.map((property) => (
          <div
            key={property.id}
            className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-3 py-2"
          >
            <div className="truncate text-sm text-[var(--color-text-secondary)]">
              {property.name}
            </div>
            <div className="min-w-0">
              <PropertyCell
                property={property}
                value={getValue(property.id)}
                options={property.options ?? []}
                onChange={(value) => onChange(property.id, value)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskSideTabContent({ task }: { task: SideTabTask }) {
  const [draftTask, setDraftTask] = useState(task);

  useEffect(() => {
    setDraftTask(task);
  }, [task]);

  return (
    <div className="mx-auto max-w-3xl">
      {draftTask.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={draftTask.coverUrl}
          alt={draftTask.name}
          className="mb-6 h-48 w-full rounded-2xl object-cover"
        />
      ) : null}
      <input
        type="text"
        value={draftTask.name}
        onChange={(event) =>
          setDraftTask((current) => ({ ...current, name: event.target.value }))
        }
        className="mb-6 w-full border-none bg-transparent text-[34px] font-bold text-[var(--color-text-primary)] outline-none"
      />
      <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--color-text-secondary)]">Status</span>
          <select
            value={draftTask.status}
            onChange={(event) =>
              setDraftTask((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] outline-none"
          >
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]">
            <CalendarDays className="h-4 w-4" />
            Date
          </span>
          <input
            type="date"
            value={draftTask.date ?? ""}
            onChange={(event) =>
              setDraftTask((current) => ({
                ...current,
                date: event.target.value,
                startDate: event.target.value,
                endDate: event.target.value,
              }))
            }
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] outline-none"
          />
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Tag className="h-4 w-4" />
            Tags
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {(draftTask.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <textarea
        value={draftTask.description ?? ""}
        onChange={(event) =>
          setDraftTask((current) => ({
            ...current,
            description: event.target.value,
          }))
        }
        placeholder="Task 상세 내용을 입력하세요..."
        className="mt-6 min-h-48 w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm leading-6 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
      />
    </div>
  );
}
