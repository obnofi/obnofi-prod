"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Palette,
  Share2,
  Users,
} from "lucide-react";
import { useCollaborators } from "@/lib/collaboration/CollaborationContext";
import { usePageSettings } from "@/hooks/usePageSettings";
import { PagePublishSection } from "@/components/workspace/PagePublishSection";
import { PageCollabSection } from "@/components/workspace/PageCollabSection";
import { PageEditSection } from "@/components/workspace/PageEditSection";
import type {
  PageHeadingFontSizes,
  PageHighlightColor,
  PageType,
} from "@obnofi/types";

export type PageExportFormat = "pdf" | "html";

type SettingsPanel = "root" | "publish" | "collaboration" | "appearance" | "export";

interface PageSettingsMenuProps {
  pageId: string;
  workspaceId: string;
  pageType: PageType;
  headingFontSizes: PageHeadingFontSizes;
  highlightColors: PageHighlightColor[];
  collaborationEnabled: boolean;
  lineIndicatorEnabled: boolean;
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
  collaborationEnabled,
  lineIndicatorEnabled,
  onHeadingFontSizesChange,
  onHighlightColorsChange,
  onCollaborationEnabledChange,
  onLineIndicatorEnabledChange,
  onExport,
}: PageSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanel>("root");
  const menuRef = useRef<HTMLDivElement>(null);
  const activeCollaborators = useCollaborators();
  const showAppearancePanel = pageType === "document";

  const settings = usePageSettings({
    pageId,
    workspaceId,
    isOpen,
    headingFontSizes,
    highlightColors,
    collaborationEnabled,
    onHeadingFontSizesChange,
    onHighlightColorsChange,
    onExport,
    onClose: () => setIsOpen(false),
  });

  // ── Click-outside close ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setActivePanel("root");
    }
  }, [isOpen]);

  const rootItems = [
    {
      key: "publish" as const,
      label: "게시",
      description: "공유 링크와 Forest 게시",
      icon: Share2,
    },
    {
      key: "collaboration" as const,
      label: "공동 편집",
      description: collaborationEnabled
        ? activeCollaborators.length > 0
          ? `${activeCollaborators.length}명 편집 중`
          : "공유 편집 활성화됨"
        : "비활성화됨",
      icon: Users,
    },
    ...(showAppearancePanel
      ? [{
          key: "appearance" as const,
          label: "편집",
          description: "제목 크기와 형광펜 색상",
          icon: Palette,
        }]
      : []),
    {
      key: "export" as const,
      label: "내보내기",
      description: onExport ? "PDF 또는 HTML로 저장" : "현재 사용할 수 없음",
      icon: Download,
      disabled: !onExport,
    },
  ];

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
        <div
          className={`absolute right-0 top-full z-[9999] mt-1 overflow-hidden transition-[width] duration-200 ease-out ${
            activePanel === "root" ? "w-64" : "w-[37rem]"
          }`}
        >
          <div className="flex items-start">
          <div className="w-64 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
            <div className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
              페이지 설정
            </div>
            {rootItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => !item.disabled && setActivePanel(item.key)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition ${
                    item.disabled
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-[var(--color-hover)]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                        {item.label}
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-text-placeholder)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-placeholder)]" />
                </button>
              );
            })}
          </div>

          {activePanel !== "root" ? (
            <div className="ml-2 w-80 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
              <div className="flex items-center gap-1 px-2 py-2">
                <button
                  type="button"
                  onClick={() => setActivePanel("root")}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  aria-label="설정 메뉴로 돌아가기"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  {activePanel === "publish"
                    ? "게시"
                    : activePanel === "collaboration"
                      ? "공동 편집"
                      : activePanel === "appearance"
                        ? "편집"
                        : "내보내기"}
                </p>
              </div>
              <div className="h-px bg-[var(--color-border)]" />

              {activePanel === "publish" ? (
                <PagePublishSection
                  pageId={pageId}
                  workspaceId={workspaceId}
                  pageType={pageType}
                  hideLabel
                />
              ) : null}

              {activePanel === "collaboration" ? (
                <PageCollabSection
                  pageType={pageType}
                  collaborationEnabled={collaborationEnabled}
                  lineIndicatorEnabled={lineIndicatorEnabled}
                  activeCollaboratorCount={activeCollaborators.length}
                  collaborators={settings.collaborators}
                  collabCopied={settings.collabCopied}
                  isCollabOpen={settings.isCollabOpen}
                  collabInviteEmail={settings.collabInviteEmail}
                  collabInviteLoading={settings.collabInviteLoading}
                  onCollaborationEnabledChange={onCollaborationEnabledChange}
                  onLineIndicatorEnabledChange={onLineIndicatorEnabledChange}
                  onCopyCollabLink={settings.handleCopyCollabLink}
                  onToggleCollabOpen={() => settings.setIsCollabOpen((v) => !v)}
                  onCollabInviteEmailChange={settings.setCollabInviteEmail}
                  onInviteCollaborator={settings.handleInviteCollaborator}
                  onRemoveCollaborator={settings.handleRemoveCollaborator}
                  hideLabel
                />
              ) : null}

              {activePanel === "appearance" ? (
                <PageEditSection
                  pageType={pageType}
                  headingFontSizes={headingFontSizes}
                  draftHeadingFontSizes={settings.draftHeadingFontSizes}
                  editingHeadingLevel={settings.editingHeadingLevel}
                  highlightColors={highlightColors}
                  isHeadingFontSizeOpen={settings.isHeadingFontSizeOpen}
                  isHighlightColorsOpen={settings.isHighlightColorsOpen}
                  isExportOpen={settings.isExportOpen}
                  onExport={onExport}
                  onToggleHeadingFontSizeOpen={() => settings.setIsHeadingFontSizeOpen((v) => !v)}
                  onToggleHighlightColorsOpen={() => settings.setIsHighlightColorsOpen((v) => !v)}
                  onToggleExportOpen={() => settings.setIsExportOpen((v) => !v)}
                  onHeadingFontSizeDraftChange={settings.handleHeadingFontSizeDraftChange}
                  onCommitHeadingFontSizeDraft={settings.commitHeadingFontSizeDraft}
                  onSetEditingHeadingLevel={settings.setEditingHeadingLevel}
                  onSetDraftHeadingFontSizes={settings.setDraftHeadingFontSizes}
                  onHighlightColorsToggle={settings.handleHighlightColorsToggle}
                  onHandleExport={settings.handleExport}
                  hideLabel
                  showExportSection={false}
                  showDangerZone={false}
                />
              ) : null}

              {activePanel === "export" ? (
                <div className="px-1 py-1.5">
                  <button
                    type="button"
                    onClick={() => settings.handleExport("pdf")}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-[var(--color-hover)]"
                  >
                    <Download className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                        PDF
                      </p>
                      <p className="text-[11px] text-[var(--color-text-placeholder)]">
                        페이지를 문서 형식으로 저장
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => settings.handleExport("html")}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-[var(--color-hover)]"
                  >
                    <Download className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                        HTML
                      </p>
                      <p className="text-[11px] text-[var(--color-text-placeholder)]">
                        정적 HTML 파일로 내보내기
                      </p>
                    </div>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
