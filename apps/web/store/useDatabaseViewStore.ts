"use client";

import { create } from "zustand";
import type { ViewType } from "@obnofi/types/database";

type GroveSurfaceView = Extract<ViewType, "table" | "gallery" | "board" | "calendar">;

interface DatabaseViewState {
  activeView: ViewType;
  groveActiveViews: Record<string, GroveSurfaceView>;
  setActiveView: (view: ViewType) => void;
  setView: (view: ViewType) => void;
  setGroveActiveView: (scopeId: string, view: GroveSurfaceView) => void;
}

export const useDatabaseViewStore = create<DatabaseViewState>((set) => ({
  activeView: "table",
  groveActiveViews: {},
  setActiveView: (view) => set({ activeView: view }),
  setView: (view) => set({ activeView: view }),
  setGroveActiveView: (scopeId, view) =>
    set((state) => ({
      groveActiveViews: {
        ...state.groveActiveViews,
        [scopeId]: view,
      },
    })),
}));
