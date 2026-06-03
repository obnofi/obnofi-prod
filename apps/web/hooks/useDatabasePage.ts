"use client";

import { useCallback, useEffect } from "react";
import type {
  DatabasePage,
  Page,
  PropertyValue,
  PropertyType,
  PropertyValueData,
  SelectOption,
} from "@obnofi/types";
import {
  fetchGroveCatalogPage,
  patchGroveCell,
  patchGroveTitle,
  plantGroveSeed,
  pruneGroveProperty,
  renameGroveSeed,
  reshapeGroveProperty,
  sproutGroveProperty,
} from "@/lib/groveCatalogApi";
import { createDefaultPropertyValue } from "@/lib/database-utils";
import {
  DEFAULT_HIGHLIGHT_COLORS,
  PAGE_ORDER_STEP,
  generateOptimisticPageId,
} from "@/lib/page/pageUtils";
import { useGroveCatalogStore } from "@/store/useGroveCatalogStore";

interface CreatePropertyInput {
  name: string;
  type: PropertyType;
  options?: SelectOption[];
}

interface UpdatePropertyInput {
  name?: string;
  type?: PropertyType;
  options?: SelectOption[];
}

interface LoadDatabasePageOptions {
  force?: boolean;
}

function buildOptimisticSeed(grovePage: DatabasePage): Page & { propertyValues: PropertyValue[] } {
  const lastOrder = grovePage.database.rows.reduce(
    (maxOrder, row) => Math.max(maxOrder, row.order),
    -PAGE_ORDER_STEP
  );
  const now = new Date().toISOString();
  const rowId = generateOptimisticPageId();

  return {
    id: rowId,
    title: "Untitled",
    groveTitleLevel: 1,
    bodyFontSizePt: 12,
    headingFontSizes: { h1: 30, h2: 23, h3: 18, h4: 16, h5: 14 },
    highlightColors: DEFAULT_HIGHLIGHT_COLORS,
    content: { type: "doc", content: [{ type: "paragraph" }] },
    type: "document",
    icon: null,
    coverImage: null,
    parentId: grovePage.id,
    order: lastOrder + PAGE_ORDER_STEP,
    workspaceId: grovePage.workspaceId,
    createdAt: now,
    updatedAt: now,
    yjsUpdatedAt: null,
    isPublic: false,
    shareId: null,
    sharePassword: null,
    databaseId: null,
    parentDatabaseId: grovePage.database.id,
    collaborationEnabled: true,
    lineIndicatorEnabled: false,
    propertyValues: grovePage.database.properties.map((property) => ({
      id: `optimistic:${rowId}:${property.id}`,
      pageId: rowId,
      propertyId: property.id,
      columnId: property.id,
      value: createDefaultPropertyValue(property),
    })),
  };
}

function findPropertyValue(
  grovePage: DatabasePage | null,
  rowId: string,
  propertyId: string
): PropertyValue | null {
  return (
    grovePage?.database.rows
      .find((row) => row.id === rowId)
      ?.propertyValues?.find(
        (propertyValue) =>
          propertyValue.propertyId === propertyId ||
          propertyValue.columnId === propertyId
      ) ?? null
  );
}

export function useDatabasePage(pageId: string | null | undefined) {
  const databasePage = useGroveCatalogStore((state) =>
    pageId ? state.grovePages[pageId] ?? null : null
  );
  const isLoading = useGroveCatalogStore((state) =>
    pageId ? Boolean(state.groveLoading[pageId]) : false
  );
  const setGrovePage = useGroveCatalogStore((state) => state.setGrovePage);
  const setGroveLoading = useGroveCatalogStore((state) => state.setGroveLoading);
  const patchGrovePageTitle = useGroveCatalogStore(
    (state) => state.patchGrovePageTitle
  );
  const replaceGroveProperty = useGroveCatalogStore(
    (state) => state.replaceGroveProperty
  );
  const removeGroveProperty = useGroveCatalogStore(
    (state) => state.removeGroveProperty
  );
  const patchGroveSeedTitle = useGroveCatalogStore(
    (state) => state.patchGroveSeedTitle
  );
  const patchGroveCellValue = useGroveCatalogStore(
    (state) => state.patchGroveCellValue
  );

  const isGroveLoaded = useGroveCatalogStore((state) => state.isGroveLoaded);
  const markGroveLoaded = useGroveCatalogStore((state) => state.markGroveLoaded);

  const loadDatabasePage = useCallback(async (options: LoadDatabasePageOptions = {}) => {
    if (!pageId) {
      return;
    }

    // 이미 로드된 페이지는 다시 로드하지 않음 (force 옵션이 없는 경우)
    if (!options.force && isGroveLoaded(pageId)) {
      return;
    }

    markGroveLoaded(pageId);
    setGroveLoading(pageId, true);
    try {
      const page = await fetchGroveCatalogPage(pageId);
      setGrovePage(pageId, page);
    } catch {
      setGrovePage(pageId, null);
      // 실패 시 재시도 가능하도록 제거는 하지 않음 (무한 루프 방지)
    } finally {
      setGroveLoading(pageId, false);
    }
  }, [pageId, isGroveLoaded, markGroveLoaded, setGroveLoading, setGrovePage]);

  useEffect(() => {
    void loadDatabasePage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]); // pageId가 변경될 때만 로드

  const setDatabasePage = useCallback(
    (nextPage: DatabasePage | null | ((current: DatabasePage | null) => DatabasePage | null)) => {
      if (!pageId) {
        return;
      }

      setGrovePage(pageId, nextPage);
    },
    [pageId, setGrovePage]
  );

  const updateDatabaseTitle = useCallback(
    async (title: string) => {
      if (!pageId) {
        return;
      }

      patchGrovePageTitle(pageId, title);
      try {
        await patchGroveTitle(pageId, title);
      } catch {
        await loadDatabasePage({ force: true });
      }
    },
    [loadDatabasePage, pageId, patchGrovePageTitle]
  );

  const createRow = useCallback(async () => {
    if (!pageId) {
      return undefined;
    }

    const currentPage = useGroveCatalogStore.getState().grovePages[pageId] ?? null;
    if (!currentPage) {
      return undefined;
    }

    const optimisticSeed = buildOptimisticSeed(currentPage);
    setGrovePage(pageId, (existingPage) => {
      if (!existingPage) {
        return existingPage;
      }

      return {
        ...existingPage,
        database: {
          ...existingPage.database,
          rows: [...existingPage.database.rows, optimisticSeed],
        },
      };
    });

    try {
      const newRow = await plantGroveSeed(currentPage.database.id, optimisticSeed.title);
      setGrovePage(pageId, (existingPage) => {
        if (!existingPage) {
          return existingPage;
        }

        return {
          ...existingPage,
          database: {
            ...existingPage.database,
            rows: existingPage.database.rows.map((row) =>
              row.id === optimisticSeed.id ? newRow : row
            ),
          },
        };
      });
      return newRow.id;
    } catch {
      setGrovePage(pageId, (existingPage) => {
        if (!existingPage) {
          return existingPage;
        }

        return {
          ...existingPage,
          database: {
            ...existingPage.database,
            rows: existingPage.database.rows.filter((row) => row.id !== optimisticSeed.id),
          },
        };
      });
      return undefined;
    }
  }, [pageId, setGrovePage]);

  const createProperty = useCallback(
    async (input: CreatePropertyInput) => {
      if (!databasePage) {
        return;
      }

      const property = await sproutGroveProperty(databasePage.database.id, input);
      if (pageId) {
        replaceGroveProperty(pageId, property);
      }
    },
    [databasePage, pageId, replaceGroveProperty]
  );

  const updateProperty = useCallback(
    async (propertyId: string, input: UpdatePropertyInput) => {
      if (!pageId) {
        return;
      }

      const updatedProperty = await reshapeGroveProperty(propertyId, input);
      replaceGroveProperty(pageId, updatedProperty);
    },
    [pageId, replaceGroveProperty]
  );

  const deleteProperty = useCallback(async (propertyId: string) => {
    if (!pageId) {
      return;
    }

    removeGroveProperty(pageId, propertyId);
    try {
      await pruneGroveProperty(propertyId);
    } catch {
      await loadDatabasePage({ force: true });
    }
  }, [loadDatabasePage, pageId, removeGroveProperty]);

  const updateRowTitle = useCallback(async (rowId: string, title: string) => {
    if (!pageId) {
      return;
    }

    const previousTitle =
      useGroveCatalogStore
        .getState()
        .grovePages[pageId]
        ?.database.rows.find((row) => row.id === rowId)?.title ?? null;

    patchGroveSeedTitle(pageId, rowId, title);
    try {
      await renameGroveSeed(rowId, title);
    } catch {
      if (previousTitle !== null) {
        patchGroveSeedTitle(pageId, rowId, previousTitle);
      } else {
        await loadDatabasePage({ force: true });
      }
    }
  }, [loadDatabasePage, pageId, patchGroveSeedTitle]);

  const updatePropertyValue = useCallback(
    async (rowId: string, propertyId: string, value: PropertyValueData) => {
      if (!pageId) {
        return;
      }

      const previousValue = findPropertyValue(
        useGroveCatalogStore.getState().grovePages[pageId] ?? null,
        rowId,
        propertyId
      );

      patchGroveCellValue(pageId, rowId, propertyId, value);
      try {
        const updatedPropertyValue = await patchGroveCell(rowId, propertyId, value);
        if (updatedPropertyValue) {
          patchGroveCellValue(pageId, rowId, propertyId, updatedPropertyValue);
        }
      } catch {
        if (previousValue) {
          patchGroveCellValue(pageId, rowId, propertyId, previousValue);
        } else {
          await loadDatabasePage({ force: true });
        }
      }
    },
    [loadDatabasePage, pageId, patchGroveCellValue]
  );

  return {
    databasePage,
    isLoading,
    loadDatabasePage,
    setDatabasePage,
    updateDatabaseTitle,
    createRow,
    createProperty,
    updateProperty,
    deleteProperty,
    updateRowTitle,
    updatePropertyValue,
  };
}
