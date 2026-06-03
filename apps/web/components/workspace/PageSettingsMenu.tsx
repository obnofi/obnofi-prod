"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const activeCollaborators = useCollaborators();

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
          <PagePublishSection
            pageId={pageId}
            workspaceId={workspaceId}
            pageType={pageType}
          />

          <div className="h-px bg-[var(--color-border)]" />

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
          />

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
          />
        </div>
      )}
    </div>
  );
}
