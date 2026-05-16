"use client";

import { useCallback, useEffect } from "react";
import type {
  DatabasePage,
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

      const resolvedPage =
        typeof nextPage === "function" ? nextPage(databasePage) : nextPage;
      setGrovePage(pageId, resolvedPage);
    },
    [databasePage, pageId, setGrovePage]
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
    if (!databasePage || !pageId) {
      return undefined;
    }

    const newRow = await plantGroveSeed(databasePage.database.id, "Untitled");
    setGrovePage(pageId, {
      ...databasePage,
      database: {
        ...databasePage.database,
        rows: [...databasePage.database.rows, newRow],
      },
    });
    return newRow.id;
  }, [databasePage, pageId, setGrovePage]);

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

    patchGroveSeedTitle(pageId, rowId, title);
    try {
      await renameGroveSeed(rowId, title);
    } catch {
      await loadDatabasePage({ force: true });
    }
  }, [loadDatabasePage, pageId, patchGroveSeedTitle]);

  const updatePropertyValue = useCallback(
    async (rowId: string, propertyId: string, value: PropertyValueData) => {
      if (!pageId) {
        return;
      }

      patchGroveCellValue(pageId, rowId, propertyId, value);
      try {
        const updatedPropertyValue = await patchGroveCell(rowId, propertyId, value);
        if (updatedPropertyValue) {
          patchGroveCellValue(pageId, rowId, propertyId, updatedPropertyValue);
        }
      } catch {
        await loadDatabasePage({ force: true });
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
