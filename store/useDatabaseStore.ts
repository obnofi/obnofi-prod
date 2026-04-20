"use client";

import type {
  ColumnSizingState,
  ColumnFiltersState,
  GroupingState,
  SortingState,
} from "@tanstack/react-table";
import { create } from "zustand";

export interface GroveQueryState {
  globalFilter: string;
  sorting: SortingState;
  grouping: GroupingState;
  columnFilters: ColumnFiltersState;
  columnSizing: ColumnSizingState;
  activeFilterColumnId: string | null;
}

const defaultGroveQueryState = (): GroveQueryState => ({
  globalFilter: "",
  sorting: [],
  grouping: [],
  columnFilters: [],
  columnSizing: {},
  activeFilterColumnId: null,
});

interface DatabaseStoreState {
  groveQueries: Record<string, GroveQueryState>;
  setGlobalFilter: (scopeId: string, globalFilter: string) => void;
  setSorting: (scopeId: string, sorting: SortingState) => void;
  setGrouping: (scopeId: string, grouping: GroupingState) => void;
  setColumnSizing: (scopeId: string, columnSizing: ColumnSizingState) => void;
  setActiveFilterColumn: (scopeId: string, columnId: string | null) => void;
  setActiveFilterValue: (scopeId: string, value: string) => void;
  resetQuery: (scopeId: string) => void;
}

function updateScopeState(
  state: DatabaseStoreState,
  scopeId: string,
  updater: (current: GroveQueryState) => GroveQueryState
) {
  const current = state.groveQueries[scopeId] ?? defaultGroveQueryState();

  return {
    groveQueries: {
      ...state.groveQueries,
      [scopeId]: updater(current),
    },
  };
}

export const useDatabaseStore = create<DatabaseStoreState>((set) => ({
  groveQueries: {},

  setGlobalFilter: (scopeId, globalFilter) =>
    set((state) =>
      updateScopeState(state, scopeId, (current) => ({
        ...current,
        globalFilter,
      }))
    ),

  setSorting: (scopeId, sorting) =>
    set((state) =>
      updateScopeState(state, scopeId, (current) => ({
        ...current,
        sorting,
      }))
    ),

  setGrouping: (scopeId, grouping) =>
    set((state) =>
      updateScopeState(state, scopeId, (current) => ({
        ...current,
        grouping,
      }))
    ),

  setColumnSizing: (scopeId, columnSizing) =>
    set((state) =>
      updateScopeState(state, scopeId, (current) => ({
        ...current,
        columnSizing,
      }))
    ),

  setActiveFilterColumn: (scopeId, columnId) =>
    set((state) =>
      updateScopeState(state, scopeId, (current) => ({
        ...current,
        activeFilterColumnId: columnId,
        columnFilters: columnId
          ? current.columnFilters.filter((filter) => filter.id === columnId)
          : [],
      }))
    ),

  setActiveFilterValue: (scopeId, value) =>
    set((state) =>
      updateScopeState(state, scopeId, (current) => {
        if (!current.activeFilterColumnId) {
          return current;
        }

        const nextFilters = current.columnFilters.filter(
          (filter) => filter.id !== current.activeFilterColumnId
        );

        if (!value.trim()) {
          return {
            ...current,
            columnFilters: nextFilters,
          };
        }

        return {
          ...current,
          columnFilters: [
            ...nextFilters,
            { id: current.activeFilterColumnId, value },
          ],
        };
      })
    ),

  resetQuery: (scopeId) =>
    set((state) => ({
      groveQueries: {
        ...state.groveQueries,
        [scopeId]: defaultGroveQueryState(),
      },
    })),
}));
