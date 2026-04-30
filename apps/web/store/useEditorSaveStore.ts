import { create } from "zustand";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface EditorSaveState {
  status: SaveStatus;
  isDirty: boolean;
  markDirty: () => void;
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
  reset: () => void;
}

export const useEditorSaveStore = create<EditorSaveState>((set) => ({
  status: "saved",
  isDirty: false,
  markDirty: () => set({ status: "unsaved", isDirty: true }),
  markSaving: () => set({ status: "saving" }),
  markSaved: () => set({ status: "saved", isDirty: false }),
  markError: () => set({ status: "error" }),
  reset: () => set({ status: "saved", isDirty: false }),
}));
