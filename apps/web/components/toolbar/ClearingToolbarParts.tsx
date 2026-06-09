"use client";

import { Redo2, Undo2 } from "lucide-react";
import type { CanvasTool, LineStyle } from "@/store/useCanvasStore";
import {
  EMOJI_ICONS,
  LINK_OPTIONS,
  PEN_COLORS,
  SHAPE_OPTIONS,
  STROKE_WIDTHS,
  STROKE_WIDTH_MIN,
  STROKE_WIDTH_MAX,
  PenToolIcon,
  Highlighter,
  type ShapeTool,
} from "@/lib/editor/clearingToolbarConstants";

// ─── Style helpers ────────────────────────────────────────────────────────────

export function toolButtonClass(isActive: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-2xl border text-[var(--color-text-primary)] transition ${
    isActive
      ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
      : "border-transparent bg-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
  }`;
}

export function iconButtonClass() {
  return "flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-[var(--color-text-primary)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]";
}

export function Divider() {
  return <div className="h-8 w-px bg-[var(--color-border)]" />;
}

// ─── PenDropdown ──────────────────────────────────────────────────────────────

interface PenDropdownProps {
  activeTool: CanvasTool;
  strokeColor: string;
  strokeWidth: number;
  onSetTool: (tool: CanvasTool) => void;
  onColorSelect: (color: string) => void;
  onStrokeWidthSelect: (width: number) => void;
  onClose: () => void;
}

export function PenDropdown({
  activeTool,
  strokeColor,
  strokeWidth,
  onSetTool,
  onColorSelect,
  onStrokeWidthSelect,
  onClose,
}: PenDropdownProps) {
  return (
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
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
                onClick={() => onColorSelect(value)}
              >
                {value === "#FFFFFF" && (
                  <span className="text-[10px] text-[var(--color-text-secondary)]">⚪</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Stroke Width</p>
            <span className="text-xs tabular-nums text-[var(--color-text-secondary)]">{strokeWidth}px</span>
          </div>

          {/* Preset chips: Thin / Medium / Bold */}
          <div className="mb-2 flex gap-1 rounded-xl bg-[var(--color-background)] p-1">
            {STROKE_WIDTHS.map(({ value, label, width }) => (
              <button
                key={value}
                className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs transition ${
                  strokeWidth === value
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
                type="button"
                onClick={() => onStrokeWidthSelect(value)}
              >
                <div className="rounded-full bg-current" style={{ width: 24, height: width }} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Fine slider */}
          <input
            aria-label="Stroke width"
            className="w-full accent-[var(--color-accent)]"
            max={STROKE_WIDTH_MAX}
            min={STROKE_WIDTH_MIN}
            step={1}
            type="range"
            value={strokeWidth}
            onChange={(event) => onStrokeWidthSelect(Number(event.target.value))}
          />
        </div>
      </div>
    </>
  );
}

// ─── ShapeDropdown ────────────────────────────────────────────────────────────

interface ShapeDropdownProps {
  activeTool: CanvasTool;
  onSelect: (tool: ShapeTool) => void;
  onClose: () => void;
}

export function ShapeDropdown({ activeTool, onSelect, onClose }: ShapeDropdownProps) {
  return (
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
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
            onClick={() => onSelect(tool)}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── LinkDropdown ─────────────────────────────────────────────────────────────

interface LinkDropdownProps {
  lineStyle: LineStyle;
  isLinkActive: boolean;
  onSelect: (style: LineStyle) => void;
  onClose: () => void;
}

export function LinkDropdown({ lineStyle, isLinkActive, onSelect, onClose }: LinkDropdownProps) {
  return (
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
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
            onClick={() => onSelect(style)}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── EmojiStampGroup ──────────────────────────────────────────────────────────

interface EmojiStampGroupProps {
  onEmojiStampSelect: (emoji: string) => void;
}

export function EmojiStampGroup({ onEmojiStampSelect }: EmojiStampGroupProps) {
  return (
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
  );
}

// ─── UndoRedoGroup ────────────────────────────────────────────────────────────

interface UndoRedoGroupProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function UndoRedoGroup({ canUndo, canRedo, onUndo, onRedo }: UndoRedoGroupProps) {
  return (
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
  );
}
