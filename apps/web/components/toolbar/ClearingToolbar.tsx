"use client";

import { useState } from "react";
import {
  ImageIcon,
  Layers3,
  MessageSquarePlus,
  MousePointer2,
  RefreshCw,
  StickyNote,
  Type,
  Highlighter,
  PenTool as PenToolIcon,
  Waypoints,
} from "lucide-react";
import type { CanvasTool, LineStyle } from "@/store/useCanvasStore";
import type { Element } from "@obnofi/types/clearing";
import { SHAPE_OPTIONS, LINK_OPTIONS, type ShapeTool } from "@/lib/editor/clearingToolbarConstants";
import {
  toolButtonClass,
  iconButtonClass,
  Divider,
  PenDropdown,
  ShapeDropdown,
  LinkDropdown,
  EmojiStampGroup,
  UndoRedoGroup,
} from "./ClearingToolbarParts";

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
  onAddElement: (kind: Extract<Element["type"], "sticky" | "connector" | "vine">) => void;
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

  const handleLinkButtonClick = () => {
    if (isLinkActive) {
      setLinkDropdownOpen((prev) => !prev);
    } else {
      onSetTool("connector");
      setLinkDropdownOpen(false);
    }
  };

  const handlePenButtonClick = () => {
    if (activeTool !== "pen" && activeTool !== "marker") {
      onSetTool("pen");
    }
    setPenDropdownOpen((prev) => !prev);
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
            <PenDropdown
              activeTool={activeTool}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              onSetTool={onSetTool}
              onColorSelect={onDrawingColorChange}
              onStrokeWidthSelect={onStrokeWidthChange}
              onClose={() => setPenDropdownOpen(false)}
            />
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
            <svg className="ml-0.5 h-2.5 w-2.5 opacity-50" viewBox="0 0 10 6" fill="currentColor">
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {shapeDropdownOpen && (
            <ShapeDropdown
              activeTool={activeTool}
              onSelect={(tool) => {
                setLastShapeTool(tool);
                onSetTool(tool);
                setShapeDropdownOpen(false);
              }}
              onClose={() => setShapeDropdownOpen(false)}
            />
          )}
        </div>

        <button
          className={toolButtonClass(activeTool === "vine")}
          onClick={() => onSetTool("vine")}
          title="Mind map"
          type="button"
        >
          <Waypoints className="h-4 w-4" />
        </button>

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
            <svg className="ml-0.5 h-2.5 w-2.5 opacity-50" viewBox="0 0 10 6" fill="currentColor">
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {linkDropdownOpen && (
            <LinkDropdown
              lineStyle={lineStyle}
              isLinkActive={isLinkActive}
              onSelect={(style) => {
                onLineStyleChange(style);
                onSetTool("connector");
                setLinkDropdownOpen(false);
              }}
              onClose={() => setLinkDropdownOpen(false)}
            />
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

      {!compact ? <EmojiStampGroup onEmojiStampSelect={onEmojiStampSelect} /> : null}

      <Divider />

      <UndoRedoGroup
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />

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
