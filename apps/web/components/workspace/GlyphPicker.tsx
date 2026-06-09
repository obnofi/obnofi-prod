"use client";

import { ImagePlus, Loader2, Search, SmilePlus, Trash2, X } from "lucide-react";
import type { Page } from "@obnofi/types";
import { PageGlyph } from "@/components/workspace/PageGlyph";

interface GlyphPickerDropdownProps {
  page: Page;
  glyphQuery: string;
  isUploadingIcon: boolean;
  iconInputRef: React.RefObject<HTMLInputElement | null>;
  filteredGlyphSections: {
    id: string;
    label: string;
    glyphs: readonly { emoji: string; keywords: readonly string[] }[];
  }[];
  onClose: () => void;
  onQueryChange: (q: string) => void;
  onSelectEmoji: (emoji: string) => void;
  onRemoveIcon: () => void;
}

export function GlyphTriggerButton({
  page,
  onClick,
}: {
  page: Page;
  onClick: () => void;
}) {
  if (page.icon) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group/glyph relative flex h-16 w-16 items-center justify-center rounded-[18px] bg-transparent text-4xl transition hover:bg-[var(--color-hover)]"
        aria-label="페이지 아이콘 변경"
      >
        <PageGlyph page={page} emojiClassName="text-4xl leading-none" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[18px] bg-[var(--color-hover)] py-0.5 text-center text-[10px] font-medium leading-none text-[var(--color-text-secondary)] opacity-0 transition-opacity duration-150 group-hover/glyph:opacity-100">
          변경
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
    >
      <SmilePlus className="h-4 w-4" />
    </button>
  );
}

export function GlyphPickerDropdown({
  page,
  glyphQuery,
  isUploadingIcon,
  iconInputRef,
  filteredGlyphSections,
  onClose,
  onQueryChange,
  onSelectEmoji,
  onRemoveIcon,
}: GlyphPickerDropdownProps) {
  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-[20rem] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div>
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            페이지 Glyph
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            Notion처럼 빠르게 찾아서 선택합니다.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pb-2 pt-1">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-placeholder)]" />
          <input
            name="glyph-search"
            type="text"
            value={glyphQuery}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="아이콘 검색"
            className="w-full rounded-lg bg-[var(--color-surface)] px-3 py-1.5 pl-9 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
          />
        </label>
      </div>

      <div className="max-h-[18rem] overflow-y-auto px-2 pb-2">
        {filteredGlyphSections.length ? (
          filteredGlyphSections.map((section) => (
            <section key={section.id} className="px-1.5 pb-2">
              <div className="px-1.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                {section.label}
              </div>
              <div className="grid grid-cols-8 gap-1">
                {section.glyphs.map(({ emoji }) => (
                  <button
                    key={`${section.id}-${emoji}`}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:bg-[var(--color-hover)]"
                    aria-label={`${emoji} 선택`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          나의 이모지 추가
        </div>
        <button
          type="button"
          onClick={() => iconInputRef.current?.click()}
          disabled={isUploadingIcon}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)] disabled:cursor-wait disabled:opacity-60"
        >
          {isUploadingIcon ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          사진으로 추가
        </button>
      </div>

      {page.icon ? (
        <div className="border-t border-[var(--color-border)] px-3 py-2">
          <button
            type="button"
            onClick={onRemoveIcon}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          >
            <Trash2 className="h-4 w-4" />
            아이콘 제거
          </button>
        </div>
      ) : null}
    </div>
  );
}
