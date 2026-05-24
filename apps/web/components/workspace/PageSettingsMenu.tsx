"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Globe,
  Link2,
  Copy,
  Check,
  Trash2,
  Type,
  Highlighter,
  Users,
  ChevronRight,
  Download,
  FileText,
  FileCode,
  UserPlus,
  X,
  AlignLeft,
} from "lucide-react";
import { useCollaborators } from "@/lib/collaboration/CollaborationContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import type {
  HeadingLevel,
  PageCollaborator,
  PageHeadingFontSizes,
  PageHighlightColor,
  PageType,
} from "@obnofi/types";

export type PageExportFormat = "pdf" | "html";

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

interface PageSettingsMenuProps {
  pageId: string;
  workspaceId: string;
  pageType: PageType;
  headingFontSizes: PageHeadingFontSizes;
  highlightColors: PageHighlightColor[];
  isPublic: boolean;
  shareId: string | null;
  collaborationEnabled: boolean;
  lineIndicatorEnabled: boolean;
  onShareUpdate: (isPublic: boolean, shareId: string | null) => void;
  onHeadingFontSizesChange: (sizes: PageHeadingFontSizes) => void;
  onHighlightColorsChange: (colors: PageHighlightColor[]) => void;
  onCollaborationEnabledChange: (enabled: boolean) => void;
  onLineIndicatorEnabledChange: (enabled: boolean) => void;
  onExport?: (format: PageExportFormat) => void;
}

export function PageSettingsMenu({
  pageId,
  workspaceId,
  pageType,
  headingFontSizes,
  highlightColors,
  isPublic,
  shareId,
  collaborationEnabled,
  lineIndicatorEnabled,
  onShareUpdate,
  onHeadingFontSizesChange,
  onHighlightColorsChange,
  onCollaborationEnabledChange,
  onLineIndicatorEnabledChange,
  onExport,
}: PageSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [publishCopied, setPublishCopied] = useState(false);
  const [collabCopied, setCollabCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHeadingFontSizeOpen, setIsHeadingFontSizeOpen] = useState(false);
  const [isHighlightColorsOpen, setIsHighlightColorsOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [collabInviteEmail, setCollabInviteEmail] = useState("");
  const [collabInviteLoading, setCollabInviteLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<PageCollaborator[]>([]);
  const [draftHeadingFontSizes, setDraftHeadingFontSizes] =
    useState<PageHeadingFontSizes>(headingFontSizes);
  const [editingHeadingLevel, setEditingHeadingLevel] = useState<HeadingLevel | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const highlightRequestIdRef = useRef(0);

  const activeCollaborators = useCollaborators();

  const publishUrl = shareId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareId}`
    : "";

  const collabUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/workspace/${workspaceId}?page=${pageId}`
      : "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsExportOpen(false);
        setIsHeadingFontSizeOpen(false);
        setIsHighlightColorsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsExportOpen(false);
      setIsHeadingFontSizeOpen(false);
      setIsHighlightColorsOpen(false);
      setIsCollabOpen(false);
      setEditingHeadingLevel(null);
      setCollabInviteEmail("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isCollabOpen || !collaborationEnabled) return;
    fetch(`/api/pages/${pageId}/collaborators`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: PageCollaborator[]) => setCollaborators(data))
      .catch(() => {});
  }, [isCollabOpen, collaborationEnabled, pageId]);

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabInviteEmail.trim()) return;
    setCollabInviteLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collabInviteEmail.trim(), role: "editor" }),
      });
      if (res.ok) {
        const newCollaborator = await res.json() as PageCollaborator;
        setCollaborators((prev) => {
          const filtered = prev.filter((c) => c.userId !== newCollaborator.userId);
          return [...filtered, newCollaborator];
        });
        setCollabInviteEmail("");
      }
    } finally {
      setCollabInviteLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    await fetch(`/api/pages/${pageId}/collaborators/${userId}`, { method: "DELETE" });
    setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
  };

  useEffect(() => {
    setDraftHeadingFontSizes(headingFontSizes);
  }, [headingFontSizes]);

  const handleExport = (format: PageExportFormat) => {
    onExport?.(format);
    setIsExportOpen(false);
    setIsOpen(false);
  };

  const handleHeadingFontSizeChange = async (
    headingLevel: HeadingLevel,
    nextSize: number
  ) => {
    const headingKey = `h${headingLevel}` as keyof PageHeadingFontSizes;
    if (headingFontSizes[headingKey] === nextSize) {
      return;
    }

    const nextHeadingFontSizes: PageHeadingFontSizes = {
      ...headingFontSizes,
      [headingKey]: nextSize,
    };
    onHeadingFontSizesChange(nextHeadingFontSizes);

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headingFontSizes: {
            [headingKey]: nextSize,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update heading font size");
      }

      const updatedPage = await response.json();
      onHeadingFontSizesChange(updatedPage.headingFontSizes);
    } catch {
      onHeadingFontSizesChange(headingFontSizes);
    }
  };

  const handleHeadingFontSizeDraftChange = (
    headingLevel: HeadingLevel,
    value: string
  ) => {
    const headingKey = `h${headingLevel}` as keyof PageHeadingFontSizes;
    const parsedValue = Number.parseInt(value, 10);

    setDraftHeadingFontSizes((current) => ({
      ...current,
      [headingKey]: Number.isNaN(parsedValue) ? current[headingKey] : parsedValue,
    }));
  };

  const commitHeadingFontSizeDraft = async (headingLevel: HeadingLevel) => {
    const headingKey = `h${headingLevel}` as keyof PageHeadingFontSizes;
    const nextSize = draftHeadingFontSizes[headingKey];

    if (!Number.isInteger(nextSize) || nextSize < 8 || nextSize > 48) {
      setDraftHeadingFontSizes(headingFontSizes);
      setEditingHeadingLevel(null);
      return;
    }

    await handleHeadingFontSizeChange(headingLevel, nextSize);
    setEditingHeadingLevel(null);
  };

  const handleHighlightColorsToggle = async (color: PageHighlightColor) => {
    const previousHighlightColors = highlightColors;
    const nextHighlightColors = highlightColors.includes(color)
      ? highlightColors.filter((item) => item !== color)
      : [...highlightColors, color];

    if (nextHighlightColors.length === 0) {
      return;
    }

    const requestId = ++highlightRequestIdRef.current;
    onHighlightColorsChange(nextHighlightColors);

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ highlightColors: nextHighlightColors }),
      });

      if (!response.ok) {
        throw new Error("Failed to update highlight colors");
      }

      const updatedPage = await response.json();
      if (requestId === highlightRequestIdRef.current) {
        onHighlightColorsChange(updatedPage.highlightColors);
      }
    } catch {
      if (requestId === highlightRequestIdRef.current) {
        onHighlightColorsChange(previousHighlightColors);
      }
    }
  };

  const handleTogglePublish = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (res.ok) {
        const data = await res.json();
        onShareUpdate(data.isPublic, data.shareId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPublishLink = async () => {
    if (!publishUrl) return;
    const copied = await copyToClipboard(publishUrl);
    if (!copied) return;
    setPublishCopied(true);
    setTimeout(() => setPublishCopied(false), 2000);
  };

  const handleCopyCollabLink = async () => {
    const copied = await copyToClipboard(collabUrl);
    if (!copied) return;
    setCollabCopied(true);
    setTimeout(() => setCollabCopied(false), 2000);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
        aria-label="페이지 설정"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[9999] mt-1 w-72 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">

          {/* ── 게시 섹션 ── */}
          <div className="px-1 py-1.5">
            <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
              게시
            </p>

            <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]">
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    웹에 게시
                  </p>
                  <p className="text-[11px] text-[var(--color-text-placeholder)]">
                    {isPublic ? "누구나 링크로 볼 수 있음" : "비공개 상태"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleTogglePublish}
                disabled={isLoading}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-wait ${
                  isPublic
                    ? "bg-[var(--color-accent)]"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                aria-label={isPublic ? "게시 취소" : "게시"}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isPublic ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {isPublic && publishUrl && (
              <div className="mx-2 mb-1 mt-1 flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-placeholder)]" />
                <span className="flex-1 truncate text-[12px] text-[var(--color-text-secondary)]">
                  {publishUrl.replace(/^https?:\/\//, "")}
                </span>
                <button
                  onClick={handleCopyPublishLink}
                  className="shrink-0 rounded p-0.5 transition hover:bg-[var(--color-hover)]"
                  aria-label="게시 링크 복사"
                >
                  {publishCopied ? (
                    <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-[var(--color-border)]" />

          {/* ── 공동 편집 섹션 ── */}
          <div className="px-1 py-1.5">
            <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
              공동 편집
            </p>

            {/* 공동 편집 켜기/끄기 */}
            <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <Users className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  {activeCollaborators.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--color-accent)] ring-1 ring-[var(--color-surface)]" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    공동 편집
                  </p>
                  <p className="text-[11px] text-[var(--color-text-placeholder)]">
                    {collaborationEnabled
                      ? activeCollaborators.length > 0
                        ? `${activeCollaborators.length}명 편집 중`
                        : "커서 기반 공유 편집이 기본으로 활성화됨"
                      : "비활성화됨"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onCollaborationEnabledChange(!collaborationEnabled)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  collaborationEnabled
                    ? "bg-[var(--color-accent)]"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                aria-label={collaborationEnabled ? "공동 편집 끄기" : "공동 편집 켜기"}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    collaborationEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 공동 편집 활성 시 추가 옵션 */}
            {collaborationEnabled && (
              <>
                {/* 커서 기반 안내 + 라인 기반 토글 (문서 타입만) */}
                {pageType === "document" && (
                  <>
                    <div className="rounded-md px-2 py-2 text-[11px] text-[var(--color-text-placeholder)]">
                      현재 모드: 커서 기반 공동 편집
                    </div>
                    <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]">
                      <div className="flex items-center gap-2.5">
                        <AlignLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                            라인 기반 점유 표시
                          </p>
                          <p className="text-[11px] text-[var(--color-text-placeholder)]">
                            커서 표시와 함께 블록 왼쪽에 협업자 색상 바 추가
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onLineIndicatorEnabledChange(!lineIndicatorEnabled)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                          lineIndicatorEnabled
                            ? "bg-[var(--color-accent)]"
                            : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                        aria-label={lineIndicatorEnabled ? "줄 점유 표시 끄기" : "줄 점유 표시 켜기"}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            lineIndicatorEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* 링크 복사 */}
                <button
                  onClick={handleCopyCollabLink}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
                >
                  <div className="flex items-center gap-2.5">
                    <Copy className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                      링크 복사
                    </span>
                  </div>
                  {collabCopied ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" />
                  )}
                </button>

                {/* 협업자 관리 */}
                <button
                  type="button"
                  onClick={() => setIsCollabOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <div className="text-left">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                        협업자 초대
                      </p>
                      <p className="text-[11px] text-[var(--color-text-placeholder)]">
                        {collaborators.length > 0
                          ? `${collaborators.length}명 초대됨`
                          : "초대된 협업자 없음"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-[var(--color-text-placeholder)] transition-transform ${
                      isCollabOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isCollabOpen && (
                  <div className="ml-2 mt-0.5 flex flex-col gap-1 border-l border-[var(--color-border)] pl-2">
                    <form onSubmit={(e) => void handleInviteCollaborator(e)} className="flex gap-1.5 px-1 py-1">
                      <input
                        type="email"
                        value={collabInviteEmail}
                        onChange={(e) => setCollabInviteEmail(e.target.value)}
                        placeholder="이메일 주소"
                        className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                      />
                      <button
                        type="submit"
                        disabled={collabInviteLoading || !collabInviteEmail.trim()}
                        className="rounded bg-[var(--color-accent)] px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                      >
                        초대
                      </button>
                    </form>
                    {collaborators.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[var(--color-hover)]"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {c.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.user.image} alt="" className="h-5 w-5 rounded-full" />
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[10px] text-[var(--color-accent)]">
                              {(c.user.name ?? c.user.email)[0].toUpperCase()}
                            </span>
                          )}
                          <span className="truncate text-[12px] text-[var(--color-text-primary)]">
                            {c.user.name ?? c.user.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRemoveCollaborator(c.userId)}
                          className="ml-1 shrink-0 rounded p-0.5 transition hover:bg-[var(--color-hover)]"
                          aria-label="협업자 제거"
                        >
                          <X className="h-3 w-3 text-[var(--color-text-secondary)]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── 편집 섹션 ── */}
          <div className="px-1 py-1.5">
            <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
              편집
            </p>

            {pageType === "document" ? (
              <div>
                <button
                  type="button"
                  onClick={() => setIsHeadingFontSizeOpen((value) => !value)}
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
                          onDoubleClick={() => setEditingHeadingLevel(headingLevel)}
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
                                  handleHeadingFontSizeDraftChange(
                                    headingLevel,
                                    event.target.value
                                  )
                                }
                                onBlur={() => void commitHeadingFontSizeDraft(headingLevel)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                  }
                                  if (event.key === "Escape") {
                                    setDraftHeadingFontSizes(headingFontSizes);
                                    setEditingHeadingLevel(null);
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
                  onClick={() => setIsHighlightColorsOpen((value) => !value)}
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
                          onClick={() => void handleHighlightColorsToggle(color)}
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

          <div className="h-px bg-[var(--color-border)]" />

          <div className="px-1 py-1.5">
            <div ref={exportRef}>
              <button
                type="button"
                onClick={() => setIsExportOpen((v) => !v)}
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

              {isExportOpen && onExport && (
                <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-2">
                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[var(--color-hover)]"
                  >
                    <FileText className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <span className="text-[13px] text-[var(--color-text-primary)]">
                      PDF
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("html")}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[var(--color-hover)]"
                  >
                    <FileCode className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <span className="text-[13px] text-[var(--color-text-primary)]">
                      HTML
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              disabled
              className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md px-2 py-2 opacity-40"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="text-[13px] font-medium text-red-500">
                휴지통으로 이동
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
