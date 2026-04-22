import { create } from "zustand";
import type { Element } from "@/types/clearing";

export type StickyNoteColor =
  | "yellow"
  | "pink"
  | "green"
  | "blue"
  | "purple"
  | "orange"
  | "gray"
  | "white";

export type StickyNoteItem = {
  id: string;
  type: "sticky";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: StickyNoteColor;
  createdBy: string;
  roomId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateStickyNoteInput = {
  x: number;
  y: number;
  createdBy: string;
  width?: number;
  content?: string;
  color?: StickyNoteColor;
  roomId?: string;
};

const MAX_HISTORY = 5;

type ElementState = {
  elements: Element[];
  stickyNotes: StickyNoteItem[];
  past: Element[][];
  future: Element[][];
  setElements: (elements: Element[]) => void;
  addElement: (element: Element) => void;
  updateElement: (elementId: string, patch: Partial<Element>) => void;
  removeElement: (elementId: string) => void;
  upsertElement: (element: Element) => void;
  pushHistory: (snapshot?: Element[]) => void;
  undo: () => void;
  redo: () => void;
  createStickyNote: (input: CreateStickyNoteInput) => StickyNoteItem;
  setStickyNotes: (stickyNotes: StickyNoteItem[]) => void;
  updateStickyNote: (stickyId: string, patch: Partial<StickyNoteItem>) => void;
  moveStickyNote: (stickyId: string, x: number, y: number) => void;
  resizeStickyNote: (stickyId: string, height: number) => void;
  deleteStickyNote: (stickyId: string) => void;
};

export const useElementStore = create<ElementState>((set) => ({
  elements: [],
  stickyNotes: [],
  past: [],
  future: [],
  setElements: (elements) =>
    set({
      elements: [...elements].sort((left, right) => left.zIndex - right.zIndex),
      past: [],
      future: [],
    }),
  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element].sort((left, right) => left.zIndex - right.zIndex),
    })),
  pushHistory: (snapshot) =>
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), snapshot ?? state.elements],
      future: [],
    })),
  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        elements: prev,
        past: state.past.slice(0, -1),
        future: [state.elements, ...state.future].slice(0, MAX_HISTORY),
      };
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        elements: next,
        past: [...state.past, state.elements].slice(-MAX_HISTORY),
        future: state.future.slice(1),
      };
    }),
  updateElement: (elementId, patch) =>
    set((state) => {
      const nextElements: Element[] = state.elements.map((element) =>
        element.id === elementId ? ({ ...element, ...patch } as Element) : element
      );
      return {
        elements: nextElements.sort((left, right) => left.zIndex - right.zIndex),
      };
    }),
  removeElement: (elementId) =>
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== elementId),
    })),
  upsertElement: (element) =>
    set((state) => {
      const existingIndex = state.elements.findIndex((candidate) => candidate.id === element.id);
      if (existingIndex === -1) {
        return {
          elements: [...state.elements, element].sort((left, right) => left.zIndex - right.zIndex),
        };
      }

      const nextElements = [...state.elements];
      nextElements[existingIndex] = element;
      return {
        elements: nextElements.sort((left, right) => left.zIndex - right.zIndex),
      };
    }),
  createStickyNote: (input) => {
    const timestamp = new Date().toISOString();
    const nextStickyNote: StickyNoteItem = {
      id: crypto.randomUUID(),
      type: "sticky",
      x: input.x,
      y: input.y,
      width: input.width ?? 240,
      height: 180,
      content: input.content ?? "",
      color: input.color ?? "yellow",
      createdBy: input.createdBy,
      roomId: input.roomId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    set((state) => ({
      stickyNotes: [...state.stickyNotes, nextStickyNote],
    }));

    return nextStickyNote;
  },
  setStickyNotes: (stickyNotes) =>
    set({
      stickyNotes,
    }),
  updateStickyNote: (stickyId, patch) =>
    set((state) => ({
      stickyNotes: state.stickyNotes.map((stickyNote) =>
        stickyNote.id === stickyId
          ? {
              ...stickyNote,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : stickyNote
      ),
    })),
  moveStickyNote: (stickyId, x, y) =>
    set((state) => ({
      stickyNotes: state.stickyNotes.map((stickyNote) =>
        stickyNote.id === stickyId
          ? {
              ...stickyNote,
              x,
              y,
              updatedAt: new Date().toISOString(),
            }
          : stickyNote
      ),
    })),
  resizeStickyNote: (stickyId, height) =>
    set((state) => ({
      stickyNotes: state.stickyNotes.map((stickyNote) =>
        stickyNote.id === stickyId
          ? {
              ...stickyNote,
              height,
              updatedAt: new Date().toISOString(),
            }
          : stickyNote
      ),
    })),
  deleteStickyNote: (stickyId) =>
    set((state) => ({
      stickyNotes: state.stickyNotes.filter((stickyNote) => stickyNote.id !== stickyId),
    })),
}));
