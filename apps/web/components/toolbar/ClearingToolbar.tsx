"use client";

import { useState } from "react";
import {
  Circle,
  Diamond,
  Highlighter,
  ImageIcon,
  Layers3,
  MessageSquarePlus,
  Minus,
  MousePointer2,
  MoveRight,
  PenTool as PenToolIcon,
  RectangleHorizontal,
  RefreshCw,
  StickyNote,
  Triangle,
  Type,
  Undo2,
  Redo2,
  Waypoints,
  ThumbsUp,
  Heart,
  Laugh,
  Flame,
  Lightbulb,
  Zap,
} from "lucide-react";
import type { CanvasTool, LineStyle } from "@/store/useCanvasStore";
import type { Element } from "@obnofi/types/clearing";

type ShapeTool = Extract<CanvasTool, "shape-rectangle" | "shape-ellipse" | "shape-diamond" | "shape-triangle">;

const SHAPE_OPTIONS: { tool: ShapeTool; label: string; Icon: React.ElementType }[] = [
  { tool: "shape-rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { tool: "shape-ellipse",   label: "Ellipse",   Icon: Circle },
  { tool: "shape-diamond",   label: "Diamond",   Icon: Diamond },
  { tool: "shape-triangle",  label: "Triangle",  Icon: Triangle },
];

type LinkOption = { style: LineStyle; label: string; Icon: React.ElementType };

const LINK_OPTIONS: LinkOption[] = [
  { style: "arrow", label: "Arrow", Icon: MoveRight },
  { style: "solid", label: "Solid line", Icon: Minus },
  { style: "dashed", label: "Dashed line", Icon: () => (
    <svg className="h-4 w-4" viewBox="0 0 16 4">
      <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
    </svg>
  )},
  { style: "dotted", label: "Dotted line", Icon: () => (
    <svg className="h-4 w-4" viewBox="0 0 16 4">
      <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
    </svg>
  )},
];

const EMOJI_ICONS = [
  { id: "thumbsUp", Icon: ThumbsUp, label: "Like" },
  { id: "heart", Icon: Heart, label: "Love" },
  { id: "laugh", Icon: Laugh, label: "Laugh" },
  { id: "flame", Icon: Flame, label: "Fire" },
  { id: "lightbulb", Icon: Lightbulb, label: "Idea" },
  { id: "zap", Icon: Zap, label: "Zap" },
] as const;

const PEN_COLORS = [
  { value: "#2E7D45", label: "Fern" },
  { value: "#1E3A5F", label: "Deep Water" },
  { value: "#C75B39", label: "Clay" },
  { value: "#D4A72C", label: "Sun" },
  { value: "#7C3AED", label: "Orchid" },
  { value: "#DC2626", label: "Berry" },
  { value: "#171717", label: "Ink" },
  { value: "#FFFFFF", label: "Mist" },
] as const;

const STROKE_WIDTHS = [
  { value: 1, label: "Thin", width: 2 },
  { value: 2, label: "Regular", width: 3 },
  { value: 4, label: "Medium", width: 4 },
  { value: 8, label: "Thick", width: 6 },
  { value: 16, label: "Bold", width: 8 },
  { value: 24, label: "Heavy", width: 10 },
] as const;

function toolButtonClass(isActive: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-2xl border text-[var(--color-text-primary)] transition ${
    isActive
      ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
      : "border-transparent bg-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
  }`;
}

function iconButtonClass() {
  return "flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-[var(--color-text-primary)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]";
}

function Divider() {
  return <div className="h-8 w-px bg-[var(--color-border)]" />;
}

export function ClearingToolbar({
  activeTool,
  canRedo,
  canUndo,
  compact = false,
  isUploadingImage,
  lineStyle,
  onAddComment,
  onAddElement,
  onDrawingColorChange,
  onEmojiStampSelect,
  onLineStyleChange,
  onOpenImagePicker,
  onRedo,
  onResetViewport,
  onSetTool,
  onStrokeWidthChange,
  onUndo,
  strokeColor,
  strokeWidth,
}: {
  activeTool: CanvasTool;
  canRedo: boolean;
  canUndo: boolean;
  compact?: boolean;
  isUploadingImage: boolean;
  lineStyle: LineStyle;
  onAddComment: () => void;
  onAddElement: (kind: Extract<Element["type"], "sticky" | "connector">) => void;
  onDrawingColorChange: (color: string) => void;
  onEmojiStampSelect: (emoji: string) => void;
  onLineStyleChange: (style: LineStyle) => void;
  onOpenImagePicker: () => void;
  onRedo: () => void;
  onResetViewport: () => void;
  onSetTool: (tool: CanvasTool) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  onUndo: () => void;
  strokeColor: string;
  strokeWidth: number;
}) {
  const [lastShapeTool, setLastShapeTool] = useState<ShapeTool>("shape-rectangle");
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const [linkDropdownOpen, setLinkDropdownOpen] = useState(false);
  const [penDropdownOpen, setPenDropdownOpen] = useState(false);

  const isShapeActive = (activeTool as string).startsWith("shape-");
  const activeShapeOption = SHAPE_OPTIONS.find((o) => o.tool === lastShapeTool) ?? SHAPE_OPTIONS[0];
  const ShapeIcon = activeShapeOption.Icon;

  const isLinkActive = activeTool === "connector";
  const activeLinkOption = LINK_OPTIONS.find((o) => o.style === lineStyle) ?? LINK_OPTIONS[0];
  const LinkIcon = activeLinkOption.Icon;

  const handleShapeButtonClick = () => {
    if (isShapeActive && activeTool === lastShapeTool) {
      setShapeDropdownOpen((prev) => !prev);
    } else {
      onSetTool(lastShapeTool);
      setShapeDropdownOpen(false);
    }
  };

  const handleShapeOptionSelect = (tool: ShapeTool) => {
    setLastShapeTool(tool);
    onSetTool(tool);
    setShapeDropdownOpen(false);
  };

  const handleLinkButtonClick = () => {
    if (isLinkActive) {
      setLinkDropdownOpen((prev) => !prev);
    } else {
      onSetTool("connector");
      setLinkDropdownOpen(false);
    }
  };

  const handleLinkOptionSelect = (style: LineStyle) => {
    onLineStyleChange(style);
    onSetTool("connector");
    setLinkDropdownOpen(false);
  };

  const handlePenButtonClick = () => {
    if (activeTool !== "pen" && activeTool !== "marker") {
      onSetTool("pen");
    }
    setPenDropdownOpen((prev) => !prev);
  };

  const handlePenColorSelect = (color: string) => {
    onDrawingColorChange(color);
  };

  const handleStrokeWidthSelect = (width: number) => {
    onStrokeWidthChange(width);
  };

  return (
    <div className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-2 overflow-visible rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]/92 px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
      <div className="flex items-center gap-1">
        <button
          className={toolButtonClass(activeTool === "select")}
          onClick={() => onSetTool("select")}
          title="Select"
          type="button"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>

        {/* Pen/Marker picker */}
        <div className="relative">
          <button
            className={`${toolButtonClass(activeTool === "pen" || activeTool === "marker")} pr-1`}
            title={activeTool === "marker" ? "Marker" : "Pen"}
            type="button"
            onClick={handlePenButtonClick}
          >
            {activeTool === "marker" ? (
              <Highlighter className="h-4 w-4" />
            ) : (
              <PenToolIcon className="h-4 w-4" />
            )}
            <svg className="ml-0.5 h-2.5 w-2.5 opacity-50" viewBox="0 0 10 6" fill="currentColor">
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {penDropdownOpen && (
            <>
              <div className="fixed inset-0 z-[998]" onClick={() => setPenDropdownOpen(false)} />
              <div className="absolute bottom-full left-0 z-[999] mb-2 min-w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <div className="mb-3 flex gap-1 rounded-xl bg-[var(--color-background)] p-1">
                  <button
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                      activeTool === "pen"
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                    type="button"
                    onClick={() => onSetTool("pen")}
                  >
                    <PenToolIcon className="h-4 w-4" />
                    Pen
                  </button>
                  <button
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                      activeTool === "marker"
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                    type="button"
                    onClick={() => onSetTool("marker")}
                  >
                    <Highlighter className="h-4 w-4" />
                    Marker
                  </button>
                </div>

                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">Color</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PEN_COLORS.map(({ value, label }) => (
                      <button
                        key={value}
                        className={`flex h-8 w-full items-center justify-center rounded-lg transition ${
                          strokeColor === value
                            ? "ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-surface)]"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: value }}
                        title={label}
                        type="button"
                        onClick={() => handlePenColorSelect(value)}
                      >
                        {value === "#FFFFFF" && (
                          <span className="text-[10px] text-[var(--color-text-secondary)]">⚪</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">Stroke Width</p>
                  <div className="flex flex-col gap-1">
                    {STROKE_WIDTHS.map(({ value, label, width }) => (
                      <button
                        key={value}
                        className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition ${
                          strokeWidth === value
                            ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                            : "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                        }`}
                        type="button"
                        onClick={() => handleStrokeWidthSelect(value)}
                      >
                        <div
                          className="rounded-full bg-current"
                          style={{ width: Math.max(16, width * 2), height: width }}
                        />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Divider />

      <div className="flex items-center gap-1">
        <button
          className={iconButtonClass()}
          onClick={() => onAddElement("sticky")}
          title="Sticky"
          type="button"
        >
          <StickyNote className="h-4 w-4" />
        </button>

        {/* Shape picker */}
        <div className="relative">
          <button
            className={`${toolButtonClass(isShapeActive)} pr-1`}
            title={activeShapeOption.label}
            type="button"
            onClick={handleShapeButtonClick}
          >
            <ShapeIcon className="h-4 w-4" />
            <svg
              className="ml-0.5 h-2.5 w-2.5 opacity-50"
              viewBox="0 0 10 6"
              fill="currentColor"
            >
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {shapeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[998]"
                onClick={() => setShapeDropdownOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-[999] mb-2 min-w-40 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                {SHAPE_OPTIONS.map(({ tool, label, Icon }) => (
                  <button
                    key={tool}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                      activeTool === tool
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                    }`}
                    type="button"
                    onClick={() => handleShapeOptionSelect(tool)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          className={toolButtonClass(activeTool === "text")}
          onClick={() => onSetTool("text")}
          title="Text"
          type="button"
        >
          <Type className="h-4 w-4" />
        </button>

        <button
          className={toolButtonClass(activeTool === "section")}
          onClick={() => onSetTool("section")}
          title="Section"
          type="button"
        >
          <Layers3 className="h-4 w-4" />
        </button>

        {/* Link/Connector picker */}
        <div className="relative">
          <button
            className={`${toolButtonClass(isLinkActive)} pr-1`}
            title={activeLinkOption.label}
            type="button"
            onClick={handleLinkButtonClick}
          >
            <LinkIcon className="h-4 w-4" />
            <svg
              className="ml-0.5 h-2.5 w-2.5 opacity-50"
              viewBox="0 0 10 6"
              fill="currentColor"
            >
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {linkDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[998]"
                onClick={() => setLinkDropdownOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-[999] mb-2 min-w-44 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                {LINK_OPTIONS.map(({ style, label, Icon }) => (
                  <button
                    key={style}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                      lineStyle === style && isLinkActive
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                    }`}
                    type="button"
                    onClick={() => handleLinkOptionSelect(style)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Divider />

      {!compact ? <Divider /> : null}

      <div className="flex items-center gap-1">
        <button
          className={iconButtonClass()}
          onClick={onOpenImagePicker}
          title={isUploadingImage ? "Uploading image" : "Image"}
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          className={toolButtonClass(activeTool === "comment")}
          onClick={onAddComment}
          title="Comment"
          type="button"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>

      {!compact ? <Divider /> : null}

      {!compact ? (
        <div className="flex items-center gap-1">
          {EMOJI_ICONS.map(({ id, Icon, label }) => (
            <button
              key={id}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-[var(--color-text-primary)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
              onClick={() => onEmojiStampSelect(id)}
              title={`Stamp ${label}`}
              type="button"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      ) : null}

      <Divider />

      <div className="flex items-center gap-1">
        <button
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-[var(--color-text-primary)] transition ${
            canUndo
              ? "hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
              : "cursor-not-allowed opacity-30"
          }`}
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (⌘Z)"
          type="button"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-[var(--color-text-primary)] transition ${
            canRedo
              ? "hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
              : "cursor-not-allowed opacity-30"
          }`}
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (⌘⇧Z)"
          type="button"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <Divider />

      <button
        className={iconButtonClass()}
        onClick={onResetViewport}
        title="Reset viewport"
        type="button"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  );
}
