export type Tool = "select" | "brush" | "eraser" | "line" | "rect" | "ellipse";

export interface Point {
  x: number;
  y: number;
}

export interface StrokeLayer {
  id: string;
  kind: "stroke";
  points: Point[];
  color: string;
  size: number;
}

export interface ShapeLayer {
  id: string;
  kind: "shape";
  shape: "line" | "rect" | "ellipse";
  start: Point;
  end: Point;
  color: string;
  size: number;
}

export type CanvasLayer = StrokeLayer | ShapeLayer;

export interface CanvasDocument {
  version: 2;
  layers: CanvasLayer[];
}

export const PALETTE = [
  "#111110",
  "#2E7D45",
  "#2563EB",
  "#DC2626",
  "#D97706",
  "#7C3AED",
];
