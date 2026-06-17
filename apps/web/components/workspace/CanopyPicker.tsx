"use client";

import { ImagePlus, RefreshCw, Trash2, X } from "lucide-react";
import { FallingLeavesLoader } from "@/components/FallingLeavesLoader";
import type { Page } from "@obnofi/types";
import { pageCanopyPresets } from "@/lib/pageCanopyPresets";

interface CanopyPickerProps {
  page: Page;
  isUploadingCanopy: boolean;
  canopyPickerRef: React.RefObject<HTMLDivElement | null>;
  canopyInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onPresetSelect: (url: string) => void;
  onRemove: () => void;
}

export function CanopyCoverArea({
  page,
  isUploadingCanopy,
  onOpenPicker,
  onRemove,
}: {
  page: Page;
  isUploadingCanopy: boolean;
  onOpenPicker: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative mb-5 overflow-hidden rounded-[20px]">
      {page.coverImage ? (
        <div className="relative h-[220px] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.coverImage}
            alt={`${page.title || "Untitled"} cover`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-[120px] w-full from-[var(--color-surface)] to-[var(--color-background)]" />
      )}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
      <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onOpenPicker}
          disabled={isUploadingCanopy}
          className="inline-flex items-center gap-2 rounded-lg disabled:opacity-70"
        >
          {isUploadingCanopy ? (
            <FallingLeavesLoader size="sm" className="text-[var(--color-text-primary)]" />
          ) : page.coverImage ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {page.coverImage ? "변경" : "커버 추가"}
        </button>
        {page.coverImage ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/60"
          >
            <Trash2 className="h-4 w-4" />
            제거
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CanopyPickerDropdown({
  page,
  canopyInputRef,
  onClose,
  onPresetSelect,
  onRemove,
}: CanopyPickerProps) {
  return (
    <div className="absolute right-0 top-12 z-30 w-[24rem] rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
            페이지 Canopy
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            기본 커버를 고르거나 직접 이미지를 올리세요.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="커버 선택기 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {pageCanopyPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetSelect(preset.url)}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left transition hover:border-[var(--color-accent)]"
          >
            <div className="h-20 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preset.url}
                alt={preset.label}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-3 py-2 text-xs font-medium text-[var(--color-text-primary)]">
              {preset.label}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => canopyInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]"
        >
          <ImagePlus className="h-4 w-4" />
          직접 업로드
        </button>

        {page.coverImage ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          >
            <Trash2 className="h-4 w-4" />
            커버 제거
          </button>
        ) : null}
      </div>
    </div>
  );
}
