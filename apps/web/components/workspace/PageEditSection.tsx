"use client";

import { useRef } from "react";
import {
  Type,
  Highlighter,
  ChevronRight,
  Download,
  FileText,
  FileCode,
  Trash2,
  Check,
} from "lucide-react";
import type {
  HeadingLevel,
  PageHeadingFontSizes,
  PageHighlightColor,
  PageType,
} from "@obnofi/types";
import type { PageExportFormat } from "@/components/workspace/PageSettingsMenu";

const headingLevels = [1, 2, 3, 4, 5] as const satisfies readonly HeadingLevel[];

const pageHighlightColorOptions: PageHighlightColor[] = [
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
];

interface PageEditSectionProps {
  pageType: PageType;
  headingFontSizes: PageHeadingFontSizes;
  draftHeadingFontSizes: PageHeadingFontSizes;
  editingHeadingLevel: HeadingLevel | null;
  highlightColors: PageHighlightColor[];
  isHeadingFontSizeOpen: boolean;
  isHighlightColorsOpen: boolean;
  isExportOpen: boolean;
  onExport?: (format: PageExportFormat) => void;
  onToggleHeadingFontSizeOpen: () => void;
  onToggleHighlightColorsOpen: () => void;
  onToggleExportOpen: () => void;
  onHeadingFontSizeDraftChange: (level: HeadingLevel, value: string) => void;
  onCommitHeadingFontSizeDraft: (level: HeadingLevel) => void;
  onSetEditingHeadingLevel: (level: HeadingLevel | null) => void;
  onSetDraftHeadingFontSizes: (sizes: PageHeadingFontSizes) => void;
  onHighlightColorsToggle: (color: PageHighlightColor) => void;
  onHandleExport: (format: PageExportFormat) => void;
  hideLabel?: boolean;
  showExportSection?: boolean;
  showDangerZone?: boolean;
}

export function PageEditSection({
  pageType,
  headingFontSizes,
  draftHeadingFontSizes,
  editingHeadingLevel,
  highlightColors,
  isHeadingFontSizeOpen,
  isHighlightColorsOpen,
  isExportOpen,
  onExport,
  onToggleHeadingFontSizeOpen,
  onToggleHighlightColorsOpen,
  onToggleExportOpen,
  onHeadingFontSizeDraftChange,
  onCommitHeadingFontSizeDraft,
  onSetEditingHeadingLevel,
  onSetDraftHeadingFontSizes,
  onHighlightColorsToggle,
  onHandleExport,
  hideLabel = false,
  showExportSection = true,
  showDangerZone = true,
}: PageEditSectionProps) {
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* ── 편집 섹션 ── */}
      <div className="px-1 py-1.5">
        {!hideLabel ? (
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
            편집
          </p>
        ) : null}

        {pageType === "document" ? (
          <div>
            <button
              type="button"
              onClick={onToggleHeadingFontSizeOpen}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
            >
              <div className="flex items-center gap-2.5">
                <Type className="h-4 w-4 text-[var(--color-text-secondary)]" />
                <div className="text-left">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    제목 크기
                  </p>
                  <p className="text-[11px] text-[var(--color-text-placeholder)]">
                    H1 {headingFontSizes.h1}pt · H2 {headingFontSizes.h2}pt
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`h-3.5 w-3.5 text-[var(--color-text-placeholder)] transition-transform ${
                  isHeadingFontSizeOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {isHeadingFontSizeOpen ? (
              <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-2">
                {headingLevels.map((headingLevel) => {
                  const headingKey = `h${headingLevel}` as keyof PageHeadingFontSizes;
                  return (
                    <div
                      key={headingLevel}
                      className="rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
                      onDoubleClick={() => onSetEditingHeadingLevel(headingLevel)}
                      title="더블클릭해서 수정"
                    >
                      {editingHeadingLevel === headingLevel ? (
                        <label className="flex items-center gap-1 text-[12px] text-[var(--color-text-secondary)]">
                          <span>H{headingLevel}:</span>
                          <input
                            type="number"
                            min={8}
                            max={48}
                            step={1}
                            autoFocus
                            value={draftHeadingFontSizes[headingKey]}
                            onChange={(event) =>
                              onHeadingFontSizeDraftChange(headingLevel, event.target.value)
                            }
                            onBlur={() => void onCommitHeadingFontSizeDraft(headingLevel)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                              if (event.key === "Escape") {
                                onSetDraftHeadingFontSizes(headingFontSizes);
                                onSetEditingHeadingLevel(null);
                              }
                            }}
                            className="w-10 border-none bg-transparent p-0 text-[12px] text-[var(--color-text-primary)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <span>px</span>
                        </label>
                      ) : (
                        <div className="text-[12px] text-[var(--color-text-secondary)]">
                          H{headingLevel}: {draftHeadingFontSizes[headingKey]}px
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {pageType === "document" ? (
          <div>
            <button
              type="button"
              onClick={onToggleHighlightColorsOpen}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
            >
              <div className="flex items-center gap-2.5">
                <Highlighter className="h-4 w-4 text-[var(--color-text-secondary)]" />
                <div className="text-left">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    형광펜 색깔
                  </p>
                  <p className="text-[11px] text-[var(--color-text-placeholder)]">
                    선택 툴바에 표시할 색상
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`h-3.5 w-3.5 text-[var(--color-text-placeholder)] transition-transform ${
                  isHighlightColorsOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {isHighlightColorsOpen ? (
              <div className="ml-6 mt-0.5 flex flex-wrap gap-2 border-l border-[var(--color-border)] pl-4 py-2">
                {pageHighlightColorOptions.map((color) => {
                  const isSelected = highlightColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => void onHighlightColorsToggle(color)}
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] transition ${
                        isSelected
                          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                          : "bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        data-highlight-swatch={color}
                      />
                      <span>{color}</span>
                      {isSelected ? <Check className="h-3 w-3" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {showExportSection || showDangerZone ? (
        <>
          <div className="h-px bg-[var(--color-border)]" />
          <div className="px-1 py-1.5">
            {showExportSection ? (
              <div ref={exportRef}>
                <button
                  type="button"
                  onClick={onToggleExportOpen}
                  disabled={!onExport}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 ${
                    onExport
                      ? "hover:bg-[var(--color-hover)]"
                      : "cursor-not-allowed opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                      내보내기
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-[var(--color-text-placeholder)] transition-transform ${
                      isExportOpen && onExport ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isExportOpen && onExport ? (
                  <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-2">
                    <button
                      type="button"
                      onClick={() => onHandleExport("pdf")}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[var(--color-hover)]"
                    >
                      <FileText className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      <span className="text-[13px] text-[var(--color-text-primary)]">PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onHandleExport("html")}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[var(--color-hover)]"
                    >
                      <FileCode className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      <span className="text-[13px] text-[var(--color-text-primary)]">HTML</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {showDangerZone ? (
              <button
                disabled
                className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md px-2 py-2 opacity-40"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="text-[13px] font-medium text-red-500">
                  휴지통으로 이동
                </span>
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}
