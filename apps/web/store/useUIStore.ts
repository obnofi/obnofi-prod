"use client";

import { create } from "zustand";

interface DatabaseModalState {
  isOpen: boolean;
  databaseId: string | null;
  pageTitle: string | null;
}

interface GroveSideTabPage {
  kind: "page";
  pageId: string;
  workspaceId?: string | null;
}

interface GroveSideTabTask {
  kind: "task";
  task: {
    id: string;
    name: string;
    status: string;
    tags?: string[];
    date?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    coverUrl?: string;
  };
}

type GroveSideTabContent = GroveSideTabPage | GroveSideTabTask;

interface GroveSideTabState {
  isOpen: boolean;
  isFullscreen: boolean;
  content: GroveSideTabContent | null;
}

interface UIStoreState {
  // Database View Modal
  databaseModal: DatabaseModalState;
  openDatabaseModal: (databaseId: string, pageTitle?: string) => void;
  closeDatabaseModal: () => void;

  // Grove Side Tab
  groveSideTab: GroveSideTabState;
  openGrovePageSideTab: (pageId: string, workspaceId?: string | null) => void;
  openGroveTaskSideTab: (task: GroveSideTabTask["task"]) => void;
  closeGroveSideTab: () => void;
  toggleGroveSideTabFullscreen: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  // Database View Modal
  databaseModal: {
    isOpen: false,
    databaseId: null,
    pageTitle: null,
  },

  openDatabaseModal: (databaseId: string, pageTitle?: string) =>
    set({
      databaseModal: {
        isOpen: true,
        databaseId,
        pageTitle: pageTitle || null,
      },
    }),

  closeDatabaseModal: () =>
    set({
      databaseModal: {
        isOpen: false,
        databaseId: null,
        pageTitle: null,
      },
    }),

  groveSideTab: {
    isOpen: false,
    isFullscreen: false,
    content: null,
  },

  openGrovePageSideTab: (pageId: string, workspaceId?: string | null) =>
    set({
      groveSideTab: {
        isOpen: true,
        isFullscreen: false,
        content: {
          kind: "page",
          pageId,
          workspaceId: workspaceId ?? null,
        },
      },
    }),

  openGroveTaskSideTab: (task: GroveSideTabTask["task"]) =>
    set({
      groveSideTab: {
        isOpen: true,
        isFullscreen: false,
        content: {
          kind: "task",
          task,
        },
      },
    }),

  closeGroveSideTab: () =>
    set({
      groveSideTab: {
        isOpen: false,
        isFullscreen: false,
        content: null,
      },
    }),

  toggleGroveSideTabFullscreen: () =>
    set((state) => ({
      groveSideTab: {
        ...state.groveSideTab,
        isFullscreen: !state.groveSideTab.isFullscreen,
      },
    })),
}));
