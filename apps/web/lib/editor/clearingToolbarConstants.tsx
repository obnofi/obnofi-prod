import {
  Circle,
  Diamond,
  Highlighter,
  Minus,
  MoveRight,
  PenTool as PenToolIcon,
  RectangleHorizontal,
  Triangle,
  ThumbsUp,
  Heart,
  Laugh,
  Flame,
  Lightbulb,
  Zap,
} from "lucide-react";
import type { ElementType } from "react";
import type { CanvasTool, LineStyle } from "@/store/useCanvasStore";

export type ShapeTool = Extract<
  CanvasTool,
  "shape-rectangle" | "shape-ellipse" | "shape-diamond" | "shape-triangle"
>;

export const SHAPE_OPTIONS: { tool: ShapeTool; label: string; Icon: ElementType }[] = [
  { tool: "shape-rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { tool: "shape-ellipse",   label: "Ellipse",   Icon: Circle },
  { tool: "shape-diamond",   label: "Diamond",   Icon: Diamond },
  { tool: "shape-triangle",  label: "Triangle",  Icon: Triangle },
];

export type LinkOption = { style: LineStyle; label: string; Icon: ElementType };

export const LINK_OPTIONS: LinkOption[] = [
  { style: "arrow",  label: "Arrow",       Icon: MoveRight },
  { style: "solid",  label: "Solid line",  Icon: Minus },
  {
    style: "dashed",
    label: "Dashed line",
    Icon: () => (
      <svg className="h-4 w-4" viewBox="0 0 16 4">
        <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
      </svg>
    ),
  },
  {
    style: "dotted",
    label: "Dotted line",
    Icon: () => (
      <svg className="h-4 w-4" viewBox="0 0 16 4">
        <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

export const EMOJI_ICONS = [
  { id: "thumbsUp",  Icon: ThumbsUp,   label: "Like" },
  { id: "heart",     Icon: Heart,      label: "Love" },
  { id: "laugh",     Icon: Laugh,      label: "Laugh" },
  { id: "flame",     Icon: Flame,      label: "Fire" },
  { id: "lightbulb", Icon: Lightbulb,  label: "Idea" },
  { id: "zap",       Icon: Zap,        label: "Zap" },
] as const;

export const PEN_COLORS = [
  { value: "#2E7D45", label: "Fern" },
  { value: "#1E3A5F", label: "Deep Water" },
  { value: "#C75B39", label: "Clay" },
  { value: "#D4A72C", label: "Sun" },
  { value: "#7C3AED", label: "Orchid" },
  { value: "#DC2626", label: "Berry" },
  { value: "#171717", label: "Ink" },
  { value: "#FFFFFF", label: "Mist" },
] as const;

export const STROKE_WIDTHS = [
  { value: 2,  label: "Thin",   width: 2 },
  { value: 6,  label: "Medium", width: 5 },
  { value: 12, label: "Bold",   width: 8 },
] as const;

export const STROKE_WIDTH_MIN = 1;
export const STROKE_WIDTH_MAX = 24;

export { PenToolIcon, Highlighter };
