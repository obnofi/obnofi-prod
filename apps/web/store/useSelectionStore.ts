import { create } from "zustand";

export type SelectionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

type SelectionState = {
  selectedIds: string[];
  selectionBounds: SelectionBounds;
  setSelectedIds: (ids: string[]) => void;
  selectSingle: (id: string | null) => void;
  toggleSelectedId: (id: string) => void;
  clearSelection: () => void;
  setSelectionBounds: (bounds: SelectionBounds) => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  selectionBounds: null,
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  selectSingle: (id) => set({ selectedIds: id ? [id] : [] }),
  toggleSelectedId: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((item) => item !== id)
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [], selectionBounds: null }),
  setSelectionBounds: (bounds) => set({ selectionBounds: bounds }),
}));
