"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Page, UpdatePageInput } from "@obnofi/types";
import { uploadPageCanopyAsset } from "@/lib/supabase";
import {
  RECENT_PAGE_GLYPHS_STORAGE_KEY,
  MAX_RECENT_PAGE_GLYPHS,
  pageGlyphSections,
} from "./pageGlyphData";
import { CanopyCoverArea, CanopyPickerDropdown } from "./CanopyPicker";
import { GlyphTriggerButton, GlyphPickerDropdown } from "./GlyphPicker";

interface GrovePageCanopyProps {
  page: Page;
  onUpdate: (input: UpdatePageInput) => Promise<void>;
  hideCover?: boolean;
  hideControls?: boolean;
}

export function GrovePageCanopy({
  page,
  onUpdate,
  hideCover = false,
  hideControls = false,
}: GrovePageCanopyProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isCanopyPickerOpen, setIsCanopyPickerOpen] = useState(false);
  const [glyphQuery, setGlyphQuery] = useState("");
  const [recentPageGlyphs, setRecentPageGlyphs] = useState<string[]>([]);
  const [isUploadingCanopy, setIsUploadingCanopy] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyInputRef = useRef<HTMLInputElement | null>(null);
  const iconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_PAGE_GLYPHS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentPageGlyphs(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      // Ignore invalid local cache.
    }
  }, []);

  useEffect(() => {
    if (!isEmojiPickerOpen && !isCanopyPickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setIsEmojiPickerOpen(false);
      }
      if (canopyPickerRef.current && !canopyPickerRef.current.contains(target)) {
        setIsCanopyPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isCanopyPickerOpen, isEmojiPickerOpen]);

  const storeRecentPageGlyph = (emoji: string) => {
    setRecentPageGlyphs((current) => {
      const next = [emoji, ...current.filter((item) => item !== emoji)].slice(
        0,
        MAX_RECENT_PAGE_GLYPHS
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem(RECENT_PAGE_GLYPHS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const filteredGlyphSections = useMemo(() => {
    const normalizedQuery = glyphQuery.trim().toLowerCase();

    const sections = pageGlyphSections
      .map((section) => ({
        ...section,
        glyphs: section.glyphs.filter(({ emoji, keywords }) => {
          if (!normalizedQuery) return true;
          return (
            emoji.includes(normalizedQuery) ||
            section.label.toLowerCase().includes(normalizedQuery) ||
            keywords.some((keyword) => keyword.includes(normalizedQuery))
          );
        }),
      }))
      .filter((section) => section.glyphs.length > 0);

    if (!recentPageGlyphs.length || normalizedQuery) return sections;

    return [
      {
        id: "recent",
        label: "최근 사용",
        glyphs: recentPageGlyphs.map((emoji) => ({ emoji, keywords: [] as string[] })),
      },
      ...sections,
    ];
  }, [glyphQuery, recentPageGlyphs]);

  const handlePageIconSelect = async (emoji: string) => {
    storeRecentPageGlyph(emoji);
    setIsEmojiPickerOpen(false);
    await onUpdate({ icon: emoji });
  };

  const handlePageIconRemove = async () => {
    setIsEmojiPickerOpen(false);
    await onUpdate({ icon: null });
  };

  const handleCanopyFilePick = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploadingCanopy(true);
    setUploadError(null);
    try {
      const coverImage = await uploadPageCanopyAsset(file, page.id);
      await onUpdate({ coverImage });
    } catch {
      setUploadError("커버 이미지를 올리지 못했습니다.");
    } finally {
      setIsUploadingCanopy(false);
      if (canopyInputRef.current) canopyInputRef.current.value = "";
    }
  };

  const handleCanopyRemove = async () => {
    setUploadError(null);
    setIsCanopyPickerOpen(false);
    await onUpdate({ coverImage: null });
  };

  const handleCanopyPresetSelect = async (coverImage: string) => {
    setUploadError(null);
    setIsCanopyPickerOpen(false);
    await onUpdate({ coverImage });
  };

  const handleIconFilePick = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploadingIcon(true);
    setUploadError(null);
    try {
      const iconUrl = await uploadPageCanopyAsset(file, `icon-${page.id}`);
      setIsEmojiPickerOpen(false);
      await onUpdate({ icon: iconUrl });
    } catch {
      setUploadError("아이콘 이미지를 올리지 못했습니다.");
    } finally {
      setIsUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = "";
    }
  };

  const revealOnHover = !page.icon && !hideControls;

  return (
    <div className={`group mb-6${revealOnHover ? " min-h-[34px]" : ""}`}>
      <input
        ref={canopyInputRef}
        name="canopy-image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleCanopyFilePick(event.target.files?.[0])}
      />
      <input
        ref={iconInputRef}
        name="icon-image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleIconFilePick(event.target.files?.[0])}
      />

      {!hideCover ? (
        <div className="relative" ref={canopyPickerRef}>
          <CanopyCoverArea
            page={page}
            isUploadingCanopy={isUploadingCanopy}
            onOpenPicker={() => setIsCanopyPickerOpen(true)}
            onRemove={() => void handleCanopyRemove()}
          />
          {isCanopyPickerOpen ? (
            <CanopyPickerDropdown
              page={page}
              isUploadingCanopy={isUploadingCanopy}
              canopyPickerRef={canopyPickerRef}
              canopyInputRef={canopyInputRef}
              onClose={() => setIsCanopyPickerOpen(false)}
              onPresetSelect={(url) => void handleCanopyPresetSelect(url)}
              onRemove={() => void handleCanopyRemove()}
            />
          ) : null}
        </div>
      ) : null}

      {!hideControls ? (
        <div
          className={`flex flex-wrap items-center gap-2${
            revealOnHover && !isEmojiPickerOpen
              ? " opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100"
              : ""
          }`}
        >
          <div className="relative" ref={emojiPickerRef}>
            <GlyphTriggerButton
              page={page}
              onClick={() => setIsEmojiPickerOpen((open) => !open)}
            />
            {isEmojiPickerOpen ? (
              <GlyphPickerDropdown
                page={page}
                glyphQuery={glyphQuery}
                isUploadingIcon={isUploadingIcon}
                iconInputRef={iconInputRef}
                filteredGlyphSections={filteredGlyphSections}
                onClose={() => setIsEmojiPickerOpen(false)}
                onQueryChange={setGlyphQuery}
                onSelectEmoji={(emoji) => void handlePageIconSelect(emoji)}
                onRemoveIcon={() => void handlePageIconRemove()}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {uploadError ? (
        <div className="mt-2 text-sm text-[#D44C47]">{uploadError}</div>
      ) : null}
    </div>
  );
}
