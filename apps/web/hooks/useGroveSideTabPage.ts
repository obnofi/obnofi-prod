"use client";

import { useEffect, useRef, useState } from "react";
import { patchGroveCell } from "@/lib/groveCatalogApi";
import { patchCachedPageTitle } from "@/lib/page/pageStoreSync";
import { isOptimisticPageId } from "@/lib/page/pageUtils";
import { useGroveCatalogStore } from "@/store/useGroveCatalogStore";
import type { Database, Page, PropertyValue, PropertyValueData } from "@obnofi/types";

// 아직 서버에 생성되지 않은 낙관적 row(Specimen)를 GroveCatalog 캐시에서 찾아 반환.
function findOptimisticGroveRow(rowId: string): {
  page: Page;
  database: Database;
} | null {
  const { grovePages } = useGroveCatalogStore.getState();

  for (const grovePage of Object.values(grovePages)) {
    const row = grovePage.database.rows.find((candidate) => candidate.id === rowId);
    if (row) {
      return { page: row, database: grovePage.database };
    }
  }

  return null;
}

interface AncestorPage {
  id: string;
  title: string;
  icon?: string | null;
}

interface GroveSideTabPageState {
  page: Page | null;
  database: Database | null;
  rowPropertyValues: PropertyValue[];
  isLoadingPage: boolean;
  ancestors: AncestorPage[];
}

const EMPTY_SIDE_TAB_PAGE_STATE: GroveSideTabPageState = {
  page: null,
  database: null,
  rowPropertyValues: [],
  isLoadingPage: false,
  ancestors: [],
};

export function useGroveSideTabPage(pageId: string | null, isOpen: boolean) {
  const patchGrovePageTitle = useGroveCatalogStore(
    (state) => state.patchGrovePageTitle
  );
  const patchGroveSeedTitle = useGroveCatalogStore(
    (state) => state.patchGroveSeedTitle
  );
  const patchGroveCellValue = useGroveCatalogStore(
    (state) => state.patchGroveCellValue
  );
  const [sideTabPageState, setSideTabPageState] =
    useState<GroveSideTabPageState>(EMPTY_SIDE_TAB_PAGE_STATE);
  const { page, database, rowPropertyValues, isLoadingPage, ancestors } = sideTabPageState;
  const titleSaveSeqRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !pageId) {
      setSideTabPageState(EMPTY_SIDE_TAB_PAGE_STATE);
      return;
    }

    let isActive = true;
    setSideTabPageState({
      ...EMPTY_SIDE_TAB_PAGE_STATE,
      isLoadingPage: true,
    });

    // 낙관적 row는 서버에 아직 없으므로 fetch 시 404. 캐시에서 바로 채워 낙관적 표시.
    if (isOptimisticPageId(pageId)) {
      const cachedRow = findOptimisticGroveRow(pageId);

      setSideTabPageState({
        page: cachedRow?.page ?? null,
        ancestors: [],
        database: cachedRow?.database ?? null,
        rowPropertyValues: cachedRow?.page.propertyValues ?? [],
        isLoadingPage: false,
      });

      return () => {
        isActive = false;
      };
    }

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
        let nextDatabase: Database | null = null;

        if (nextPage?.parentDatabaseId) {
          const cachedDatabasePage = Object.values(
            useGroveCatalogStore.getState().grovePages
          ).find(
            (grovePage) => grovePage.database.id === nextPage.parentDatabaseId
          );

          if (cachedDatabasePage) {
            nextDatabase = cachedDatabasePage.database;
          } else {
            const databaseResponse = await fetch(
              `/api/databases/${nextPage.parentDatabaseId}?view=schema`
            );
            if (!isActive || !databaseResponse.ok) {
              return;
            }

            nextDatabase = (await databaseResponse.json()) as Database;
          }
        }

        if (!isActive) {
          return;
        }

        setSideTabPageState({
          page: nextPage,
          ancestors: ancestorsData,
          database: nextDatabase,
          rowPropertyValues: nextPage?.propertyValues ?? [],
          isLoadingPage: false,
        });
      })
      .catch(() => {
        if (isActive) {
          setSideTabPageState(EMPTY_SIDE_TAB_PAGE_STATE);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isOpen, pageId]);

  const handlePageTitleChange = async (title: string) => {
    if (!page) {
      return;
    }

    const previousTitle = page.title;
    const parentDatabasePageId = database?.pageId ?? null;
    const saveSeq = ++titleSaveSeqRef.current;
    const nextPage = { ...page, title };

    setSideTabPageState((current) => ({
      ...current,
      page: current.page?.id === page.id ? nextPage : current.page,
    }));
    patchCachedPageTitle(page.id, title);

    if (page.type === "database") {
      patchGrovePageTitle(page.id, title);
    }

    if (parentDatabasePageId) {
      patchGroveSeedTitle(parentDatabasePageId, page.id, title);
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error("Failed to update page title");
      }

      const savedPage = (await response.json()) as Page;
      if (saveSeq !== titleSaveSeqRef.current) {
        return;
      }

      setSideTabPageState((current) => ({
        ...current,
        page:
          current.page?.id === savedPage.id
            ? { ...current.page, updatedAt: savedPage.updatedAt }
            : current.page,
      }));
      patchCachedPageTitle(savedPage.id, title);

      if (savedPage.type === "database") {
        patchGrovePageTitle(savedPage.id, title);
      }

      if (parentDatabasePageId) {
        patchGroveSeedTitle(parentDatabasePageId, savedPage.id, title);
      }
    } catch {
      if (saveSeq !== titleSaveSeqRef.current) {
        return;
      }

      setSideTabPageState((current) => ({
        ...current,
        page:
          current.page?.id === page.id
            ? { ...current.page, title: previousTitle }
            : current.page,
      }));
      patchCachedPageTitle(page.id, previousTitle);

      if (page.type === "database") {
        patchGrovePageTitle(page.id, previousTitle);
      }

      if (parentDatabasePageId) {
        patchGroveSeedTitle(parentDatabasePageId, page.id, previousTitle);
      }
    }
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

    setSideTabPageState((current) => {
      const existingIndex = current.rowPropertyValues.findIndex(
        (propertyValue) =>
          propertyValue.propertyId === propertyId ||
          propertyValue.columnId === propertyId
      );

      if (existingIndex === -1) {
        return {
          ...current,
          rowPropertyValues: [...current.rowPropertyValues, optimisticValue],
        };
      }

      return {
        ...current,
        rowPropertyValues: current.rowPropertyValues.map((propertyValue, index) =>
          index === existingIndex
            ? { ...propertyValue, value }
            : propertyValue
        ),
      };
    });
    patchGroveCellValue(database.pageId, page.id, propertyId, value);

    try {
      const savedValue = await patchGroveCell(page.id, propertyId, value);
      if (savedValue) {
        setSideTabPageState((current) => {
          const existingIndex = current.rowPropertyValues.findIndex(
            (propertyValue) =>
              propertyValue.propertyId === propertyId ||
              propertyValue.columnId === propertyId
          );

          if (existingIndex === -1) {
            return {
              ...current,
              rowPropertyValues: [...current.rowPropertyValues, savedValue],
            };
          }

          return {
            ...current,
            rowPropertyValues: current.rowPropertyValues.map((propertyValue, index) =>
              index === existingIndex ? savedValue : propertyValue
            ),
          };
        });
        patchGroveCellValue(database.pageId, page.id, propertyId, savedValue);
      }
    } catch {
      const pageResponse = await fetch(`/api/pages/${page.id}`);
      if (pageResponse.ok) {
        const nextPage = (await pageResponse.json()) as Page;
        setSideTabPageState((current) => ({
          ...current,
          page: nextPage,
          rowPropertyValues: nextPage.propertyValues ?? [],
        }));
      }
    }
  };

  return {
    page,
    database,
    rowPropertyValues,
    isLoadingPage,
    ancestors,
    handlePageTitleChange,
    handlePageContentUpdate,
    handlePropertyValueChange,
  };
}
