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
} from "lucide-react";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { copyToClipboard } from "@/lib/copyToClipboard";

export type PageExportFormat = "pdf" | "html";

interface PageSettingsMenuProps {
  pageId: string;
  workspaceId: string;
  isPublic: boolean;
  shareId: string | null;
  onShareUpdate: (isPublic: boolean, shareId: string | null) => void;
  onExport?: (format: PageExportFormat) => void;
}

export function PageSettingsMenu({
  pageId,
  workspaceId,
  isPublic,
  shareId,
  onShareUpdate,
  onExport,
}: PageSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [publishCopied, setPublishCopied] = useState(false);
  const [collabCopied, setCollabCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const { collaborators } = useCollaboration();

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
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setIsExportOpen(false);
  }, [isOpen]);

  const handleExport = (format: PageExportFormat) => {
    onExport?.(format);
    setIsExportOpen(false);
    setIsOpen(false);
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
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isPublic ? "translate-x-4" : "translate-x-0.5"
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

          {/* ── 편집 섹션 ── */}
          <div className="px-1 py-1.5">
            <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
              편집
            </p>

            {/* 공동 편집 링크 — 활성 */}
            <button
              onClick={handleCopyCollabLink}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <Users className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  {collaborators.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--color-accent)] ring-1 ring-[var(--color-surface)]" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    공동 편집 링크 복사
                  </p>
                  <p className="text-[11px] text-[var(--color-text-placeholder)]">
                    {collaborators.length > 0
                      ? `${collaborators.length}명 편집 중`
                      : "워크스페이스 멤버와 공유"}
                  </p>
                </div>
              </div>
              {collabCopied ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
              ) : (
                <Copy className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" />
              )}
            </button>

            <DisabledMenuItem
              label="글꼴 크기"
              hint="준비 중"
              trailing={<ChevronRight className="h-3.5 w-3.5" />}
            />
            <DisabledMenuItem
              label="형광펜 색깔"
              hint="준비 중"
              trailing={<ChevronRight className="h-3.5 w-3.5" />}
            />
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

function DisabledMenuItem({
  label,
  hint,
  trailing,
}: {
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex cursor-not-allowed items-center justify-between rounded-md px-2 py-2 opacity-40">
      <div className="flex items-center gap-2.5">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {label}
          </p>
          {hint && (
            <p className="text-[11px] text-[var(--color-text-placeholder)]">
              {hint}
            </p>
          )}
        </div>
      </div>
      {trailing && (
        <span className="text-[var(--color-text-placeholder)]">{trailing}</span>
      )}
    </div>
  );
}
