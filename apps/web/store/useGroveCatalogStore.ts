"use client";

import { create } from "zustand";
import type {
  DatabasePage,
  Property,
  PropertyValue,
  PropertyValueData,
  View,
} from "@obnofi/types";

interface GroveCatalogState {
  grovePages: Record<string, DatabasePage>;
  groveLoading: Record<string, boolean>;
  groveLoaded: Set<string>; // 이미 로드된 페이지 ID 추적
  setGrovePage: (
    pageId: string,
    grovePage:
      | DatabasePage
      | null
      | ((current: DatabasePage | null) => DatabasePage | null)
  ) => void;
  setGroveLoading: (pageId: string, isLoading: boolean) => void;
  markGroveLoaded: (pageId: string) => void;
  isGroveLoaded: (pageId: string) => boolean;
  patchGrovePageTitle: (pageId: string, title: string) => void;
  replaceGroveProperty: (pageId: string, property: Property) => void;
  removeGroveProperty: (pageId: string, propertyId: string) => void;
  patchGroveSeedTitle: (pageId: string, rowId: string, title: string) => void;
  appendGroveView: (pageId: string, view: View) => void;
  replaceGroveView: (pageId: string, view: View) => void;
  patchGroveCellValue: (
    pageId: string,
    rowId: string,
    propertyId: string,
    value: PropertyValueData | PropertyValue | undefined
  ) => void;
}

function normalizePropertyValue(
  rowId: string,
  propertyId: string,
  value: PropertyValueData | PropertyValue | undefined
): PropertyValue | null {
  if (!value) {
    return null;
  }

  if ("pageId" in value && "propertyId" in value) {
    return value;
  }

  return {
    id: `optimistic:${rowId}:${propertyId}`,
    pageId: rowId,
    propertyId,
    columnId: propertyId,
    value,
  };
}

export const useGroveCatalogStore = create<GroveCatalogState>((set, get) => ({
  grovePages: {},
  groveLoading: {},
  groveLoaded: new Set<string>(),

  setGrovePage: (pageId, grovePage) =>
    set((state) => {
      const resolvedPage =
        typeof grovePage === "function"
          ? grovePage(state.grovePages[pageId] ?? null)
          : grovePage;

      if (!resolvedPage) {
        const nextPages = { ...state.grovePages };
        delete nextPages[pageId];
        return { grovePages: nextPages };
      }

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: resolvedPage,
        },
      };
    }),

  setGroveLoading: (pageId, isLoading) =>
    set((state) => ({
      groveLoading: {
        ...state.groveLoading,
        [pageId]: isLoading,
      },
    })),

  markGroveLoaded: (pageId) =>
    set((state) => {
      const nextLoaded = new Set(state.groveLoaded);
      nextLoaded.add(pageId);
      return { groveLoaded: nextLoaded };
    }),

  isGroveLoaded: (pageId) => get().groveLoaded.has(pageId),

  patchGrovePageTitle: (pageId, title) =>
    set((state) => {
      const grovePage = state.grovePages[pageId];
      if (!grovePage) {
        return state;
      }

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: { ...grovePage, title },
        },
      };
    }),

  replaceGroveProperty: (pageId, property) =>
    set((state) => {
      const grovePage = state.grovePages[pageId];
      if (!grovePage) {
        return state;
      }

      const nextProperties = grovePage.database.properties.some(
        (current) => current.id === property.id
      )
        ? grovePage.database.properties.map((current) =>
            current.id === property.id ? property : current
          )
        : [...grovePage.database.properties, property].sort(
            (left, right) => left.order - right.order
          );

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: {
            ...grovePage,
            database: {
              ...grovePage.database,
              properties: nextProperties,
              columns: nextProperties,
            },
          },
        },
      };
    }),

  removeGroveProperty: (pageId, propertyId) =>
    set((state) => {
      const grovePage = state.grovePages[pageId];
      if (!grovePage) {
        return state;
      }

      const nextProperties = grovePage.database.properties.filter(
        (property) => property.id !== propertyId
      );

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: {
            ...grovePage,
            database: {
              ...grovePage.database,
              properties: nextProperties,
              columns: nextProperties,
            },
          },
        },
      };
    }),

  patchGroveSeedTitle: (pageId, rowId, title) =>
    set((state) => {
      const grovePage = state.grovePages[pageId];
      if (!grovePage) {
        return state;
      }

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: {
            ...grovePage,
            database: {
              ...grovePage.database,
              rows: grovePage.database.rows.map((row) =>
                row.id === rowId ? { ...row, title } : row
              ),
            },
          },
        },
      };
    }),

  appendGroveView: (pageId, view) =>
    set((state) => {
      const grovePage = state.grovePages[pageId];
      if (!grovePage) {
        return state;
      }

      const currentViews = grovePage.database.views ?? [];
      const nextViews = currentViews.some((current) => current.id === view.id)
        ? currentViews
        : [...currentViews, view];

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: {
            ...grovePage,
            database: {
              ...grovePage.database,
              views: nextViews,
            },
          },
        },
      };
    }),

  replaceGroveView: (pageId, view) =>
    set((state) => {
      const grovePage = state.grovePages[pageId];
      if (!grovePage) {
        return state;
      }

      const currentViews = grovePage.database.views ?? [];
      const nextViews = currentViews.some((current) => current.id === view.id)
        ? currentViews.map((current) => (current.id === view.id ? view : current))
        : [...currentViews, view];

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: {
            ...grovePage,
            database: {
              ...grovePage.database,
              views: nextViews,
            },
          },
        },
      };
    }),

  patchGroveCellValue: (pageId, rowId, propertyId, value) =>
    set((state) => {
      const grovePage = state.grovePages[pageId];
      if (!grovePage) {
        return state;
      }

      const nextPropertyValue = normalizePropertyValue(rowId, propertyId, value);
      if (!nextPropertyValue) {
        return state;
      }

      return {
        grovePages: {
          ...state.grovePages,
          [pageId]: {
            ...grovePage,
            database: {
              ...grovePage.database,
              rows: grovePage.database.rows.map((row) => {
                if (row.id !== rowId) {
                  return row;
                }

                const propertyValues = row.propertyValues ?? [];
                const existingIndex = propertyValues.findIndex(
                  (propertyValue) =>
                    propertyValue.propertyId === propertyId ||
                    propertyValue.columnId === propertyId
                );

                if (existingIndex === -1) {
                  return {
                    ...row,
                    propertyValues: [...propertyValues, nextPropertyValue],
                  };
                }

                return {
                  ...row,
                  propertyValues: propertyValues.map((propertyValue, index) =>
                    index === existingIndex ? nextPropertyValue : propertyValue
                  ),
                };
              }),
            },
          },
        },
      };
    }),
}));
