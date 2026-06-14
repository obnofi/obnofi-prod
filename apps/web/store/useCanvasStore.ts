import { create } from "zustand";

export type LineStyle = "arrow" | "solid" | "dashed" | "dotted";

export type CanvasTool =
  | "select"
  | "pan"
  | "shape-rectangle"
  | "shape-ellipse"
  | "shape-diamond"
  | "shape-triangle"
  | "text"
  | "vine"
  | "pen"
  | "marker"
  | "connector"
  | "section"
  | "comment"
  | "laser";

export type Viewport = {
  x: number;
  y: number;
  scale: number;
  zoom: number;
};

type CanvasState = {
  tool: CanvasTool;
  lineStyle: LineStyle;
  viewport: Viewport;
  selectedElementId: string | null;
  setTool: (tool: CanvasTool) => void;
  setLineStyle: (style: LineStyle) => void;
  setViewport: (patch: Partial<Viewport>) => void;
  resetViewport: () => void;
  setSelectedElement: (elementId: string | null) => void;
};

const initialViewport: Viewport = {
  x: 180,
  y: 140,
  scale: 1,
  zoom: 1,
};

export const useCanvasStore = create<CanvasState>((set) => ({
  tool: "select",
  lineStyle: "arrow",
  viewport: initialViewport,
  selectedElementId: null,
  setTool: (tool) => set({ tool }),
  setLineStyle: (lineStyle) => set({ lineStyle }),
  setViewport: (patch) =>
    set((state) => ({
      viewport: (() => {
        const nextViewport = {
          ...state.viewport,
          ...patch,
        };
        const nextScale =
          patch.scale ?? patch.zoom ?? state.viewport.scale;

        return {
          ...nextViewport,
          scale: nextScale,
          zoom: nextScale,
        };
      })(),
    })),
  resetViewport: () =>
    set({
      viewport: initialViewport,
      selectedElementId: null,
    }),
  setSelectedElement: (elementId) => set({ selectedElementId: elementId }),
}));
