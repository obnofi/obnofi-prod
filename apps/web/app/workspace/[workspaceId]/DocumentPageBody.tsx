"use client";

import { type RefObject } from "react";
import {
  FileText,
  Network,
  Palette,
  Database,
  Plus,
  Loader2,
} from "lucide-react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { Page, PageType } from "@obnofi/types";
import { GrovePageCanopy } from "@/components/workspace/GrovePageCanopy";
import { PageTitleBlock } from "@/components/workspace/PageTitleBlock";
import { TableOfContents } from "@/components/workspace/TableOfContents";
import { ImportFromUrlControl } from "@/components/workspace/ImportFromUrlControl";
import type { MossNoteDockHandle } from "@/components/workspace/MossNoteDock";
import {
  creatablePageLabels,
  creatablePageTypes,
} from "@/lib/pageCreation";
import {
  CollaborativeEditorSurface,
  type CollaborativeEditorSurfaceProps,
} from "./CollaborativeEditorSurface";

const childTypeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="h-4 w-4" />,
  canvas: <Palette className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  mindmap: <Network className="h-4 w-4" />,
};

export interface DocumentPageBodyProps {
  activePage: Page;
  pageId: string;
  workspaceId: string;
  title: string;
  isLoading: boolean;
  pendingChildType: PageType | null;
  grovePageSurfaceRef: RefObject<HTMLDivElement | null>;
  mossNoteDockRef: RefObject<MossNoteDockHandle | null>;
  groveContentElement: HTMLDivElement | null;
  onTitleChange: (title: string) => void;
  onPageChromeUpdate: (input: Partial<Pick<Page, "icon" | "coverImage">>) => Promise<void>;
  onCreateChildPage: (type: PageType) => void;
  onGroveContentReady: (el: HTMLDivElement | null) => void;
  onEditorReady: (editor: TiptapEditor | null) => void;
  editorSurfaceProps: Omit<
    CollaborativeEditorSurfaceProps,
    "onContentContainerReady" | "onEditorReady"
  >;
}

export function DocumentPageBody({
  activePage,
  pageId,
  workspaceId,
  title,
  isLoading,
  pendingChildType,
  grovePageSurfaceRef,
  groveContentElement,
  onTitleChange,
  onPageChromeUpdate,
  onCreateChildPage,
  onGroveContentReady,
  onEditorReady,
  editorSurfaceProps,
}: DocumentPageBodyProps) {
  return (
    <div
      ref={grovePageSurfaceRef}
      data-testid="grove-page-surface"
      className="relative h-full overflow-y-auto"
    >
      {activePage.coverImage ? (
        <div className="w-full px-0 pt-0">
          <GrovePageCanopy
            page={activePage}
            onUpdate={onPageChromeUpdate}
            hideControls={true}
          />
        </div>
      ) : null}

      <div className="max-w-4xl mx-auto px-12 pb-28 pt-8">
        {!activePage.coverImage ? (
          <GrovePageCanopy page={activePage} onUpdate={onPageChromeUpdate} />
        ) : (
          <GrovePageCanopy
            page={activePage}
            onUpdate={onPageChromeUpdate}
            hideCover={true}
          />
        )}

        <PageTitleBlock
          value={title}
          onChange={(nextTitle) => onTitleChange(nextTitle)}
          placeholder="Untitled"
          size="page"
          testId="workspace-page-title"
        />

        {/* Mobile Add Buttons */}
        <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:hidden">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
            <Plus className="h-3.5 w-3.5" />Add to doc
          </div>
          <div className="grid grid-cols-2 gap-2">
            {creatablePageTypes.map((type) => {
              const isPending = pendingChildType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onCreateChildPage(type)}
                  disabled={pendingChildType !== null}
                  className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left transition hover:border-[#2E7D45] hover:bg-[var(--color-accent-subtle)] disabled:cursor-wait disabled:opacity-60"
                >
                  <div className="flex w-full items-center justify-between text-[#2E7D45]">
                    <span className="rounded-lg bg-[#E8F3EC] p-2">
                      {childTypeIcons[type]}
                    </span>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {creatablePageLabels[type]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2">
            <ImportFromUrlControl
              workspaceId={workspaceId}
              parentId={pageId}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)]"
            />
          </div>
        </div>

        {/* Editor */}
        {isLoading && activePage.content === null ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : (
          <CollaborativeEditorSurface
            {...editorSurfaceProps}
            onContentContainerReady={onGroveContentReady}
            onEditorReady={onEditorReady}
          />
        )}
      </div>
      <TableOfContents container={groveContentElement} />
    </div>
  );
}
