"use client";

import { startTransition } from "react";
import dynamic from "next/dynamic";
import { ChevronRight, FileText, Network, Palette, Database } from "lucide-react";
import type { Page, PageType } from "@obnofi/types";
import { CollaborationAvatars } from "@/components/workspace/CollaborationAvatars";
import { SaveStatusIndicator } from "@/components/workspace/SaveStatusIndicator";
import type { PageExportFormat } from "@/components/workspace/PageSettingsMenu";

const PageSettingsMenu = dynamic(
  () =>
    import("@/components/workspace/PageSettingsMenu").then(
      (mod) => mod.PageSettingsMenu
    ),
  { ssr: false }
);

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  mindmap: <Network className="w-4 h-4" />,
};

export interface WorkspacePageHeaderProps {
  pageTrail: Page[];
  activePage: Page;
  workspaceId: string;
  pageId: string;
  collabActive: boolean;
  onSaveRetry: () => void;
  onSelectPage: (pageId: string) => void;
  onHeadingFontSizesChange: (v: Page["headingFontSizes"]) => void;
  onHighlightColorsChange: (v: Page["highlightColors"]) => void;
  onCollaborationEnabledChange: (v: boolean) => void;
  onLineIndicatorEnabledChange: (v: boolean) => void;
  onExport?: (format: PageExportFormat) => void;
}

export function WorkspacePageHeader({
  pageTrail,
  activePage,
  workspaceId,
  pageId,
  collabActive,
  onSaveRetry,
  onSelectPage,
  onHeadingFontSizesChange,
  onHighlightColorsChange,
  onCollaborationEnabledChange,
  onLineIndicatorEnabledChange,
  onExport,
}: WorkspacePageHeaderProps) {
  return (
    <header className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0 bg-[var(--color-background)]">
      <div className="flex min-w-0 items-center gap-1 text-[14px]">
        {pageTrail.map((page, index) => {
          const isCurrent = page.id === activePage.id;

          return (
            <span key={page.id} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-placeholder)]" />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (!isCurrent) {
                    startTransition(() => onSelectPage(page.id));
                  }
                }}
                disabled={isCurrent}
                className={`inline-flex min-w-0 max-w-[180px] items-center gap-1.5 rounded px-1.5 py-1 transition ${
                  isCurrent
                    ? "cursor-default text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                }`}
                title={page.title || "Untitled"}
              >
                <span className="shrink-0 text-[var(--color-text-secondary)]">
                  {page.icon ? <span>{page.icon}</span> : typeIcons[page.type]}
                </span>
                <span className="truncate">{page.title || "Untitled"}</span>
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <SaveStatusIndicator onRetry={onSaveRetry} />
        {collabActive ? <CollaborationAvatars /> : null}
        <PageSettingsMenu
          pageId={pageId}
          workspaceId={workspaceId}
          pageType={activePage.type}
          headingFontSizes={activePage.headingFontSizes}
          highlightColors={activePage.highlightColors}
          collaborationEnabled={activePage.collaborationEnabled}
          lineIndicatorEnabled={activePage.lineIndicatorEnabled}
          onHeadingFontSizesChange={onHeadingFontSizesChange}
          onHighlightColorsChange={onHighlightColorsChange}
          onCollaborationEnabledChange={onCollaborationEnabledChange}
          onLineIndicatorEnabledChange={onLineIndicatorEnabledChange}
          onExport={onExport}
        />
      </div>
    </header>
  );
}
