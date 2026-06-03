"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { Loader2 } from "lucide-react";
import { Page, PageType } from "@obnofi/types";
import { GroveInsertionToolbar } from "@/components/toolbar/GroveInsertionToolbar";
import type { MossNoteDockHandle } from "@/components/workspace/MossNoteDock";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";
import { DocumentPageBody } from "./DocumentPageBody";
import type { RefObject, MutableRefObject } from "react";

const ClearingBoard = dynamic(
  () => import("@/components/canvas/ClearingBoard").then((mod) => mod.ClearingBoard),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
      </div>
    ),
    ssr: false,
  }
);

const DatabaseWorkspace = dynamic(
  () =>
    import("@/components/database/DatabaseWorkspace").then(
      (mod) => mod.DatabaseWorkspace
    ),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
      </div>
    ),
  }
);

export interface WorkspacePageContentProps {
  activePage: Page;
  pageId: string;
  workspaceId: string;
  title: string;
  isLoading: boolean;
  pendingChildType: PageType | null;
  grovePageSurfaceRef: RefObject<HTMLDivElement | null>;
  mossNoteDockRef: MutableRefObject<MossNoteDockHandle | null>;
  groveContentElement: HTMLDivElement | null;
  interimTranscript: string;
  isListening: boolean;
  isSpeechSupported: boolean;
  speechListeningState: ParrotListeningState;
  speechLevel: number;
  scheduleSave: () => void;
  onTitleChange: (newTitle: string) => void;
  onPageChromeUpdate: (input: Partial<Pick<Page, "icon" | "coverImage">>) => Promise<void>;
  onCreateChildPage: (type: PageType) => void;
  onGroveContentReady: (el: HTMLDivElement | null) => void;
  onEditorReady: (editor: TiptapEditor) => void;
  onEditorUpdate: (content: object) => void;
  onToggleSpeech: () => void;
}

export function WorkspacePageContent({
  activePage,
  pageId,
  workspaceId,
  title,
  isLoading,
  pendingChildType,
  grovePageSurfaceRef,
  mossNoteDockRef,
  groveContentElement,
  interimTranscript,
  isListening,
  isSpeechSupported,
  speechListeningState,
  speechLevel,
  scheduleSave,
  onTitleChange,
  onPageChromeUpdate,
  onCreateChildPage,
  onGroveContentReady,
  onEditorReady,
  onEditorUpdate,
  onToggleSpeech,
}: WorkspacePageContentProps) {
  const [toolbarEditor, setToolbarEditor] = useState<TiptapEditor | null>(null);

  const handleEditorReady = useCallback(
    (editor: TiptapEditor) => {
      setToolbarEditor(editor);
      onEditorReady(editor);
    },
    [onEditorReady]
  );

  return (
    <div className="relative flex-1 overflow-hidden bg-[var(--color-background)]">
      {activePage.type === "document" && (
        <>
          <DocumentPageBody
            activePage={activePage}
            pageId={pageId}
            workspaceId={workspaceId}
            title={title}
            isLoading={isLoading}
            pendingChildType={pendingChildType}
            grovePageSurfaceRef={grovePageSurfaceRef}
            mossNoteDockRef={mossNoteDockRef}
            groveContentElement={groveContentElement}
            onTitleChange={onTitleChange}
            onPageChromeUpdate={onPageChromeUpdate}
            onCreateChildPage={onCreateChildPage}
            onGroveContentReady={onGroveContentReady}
            onEditorReady={handleEditorReady}
            editorSurfaceProps={{
              pageId,
              workspaceId,
              content: activePage.content,
              bodyFontSizePt: activePage.bodyFontSizePt,
              headingFontSizes: activePage.headingFontSizes,
              highlightColors: activePage.highlightColors,
              pageUpdatedAt: activePage.updatedAt,
              yjsUpdatedAt: activePage.yjsUpdatedAt,
              onUpdate: onEditorUpdate,
              onEdit: scheduleSave,
              lineIndicatorEnabled: activePage.lineIndicatorEnabled,
              interimTranscript,
              isSpeechListening: isListening,
              speechListeningState,
              mossNoteDockRef,
              mossNoteSurfaceRef: grovePageSurfaceRef,
            }}
          />
          <GroveInsertionToolbar
            editor={toolbarEditor}
            isListening={isListening}
            isSpeechSupported={isSpeechSupported}
            speechListeningState={speechListeningState}
            speechLevel={speechLevel}
            interimTranscript={interimTranscript}
            onToggleSpeech={onToggleSpeech}
            onToggleMossNote={() => mossNoteDockRef.current?.togglePlacement()}
          />
        </>
      )}

      {activePage.type === "canvas" && (
        <div className="h-full">
          <ClearingBoard
            embedded={true}
            roomSlug={activePage.id}
            title={activePage.title || "Jungle Clearing"}
            onTitleChange={onTitleChange}
          />
        </div>
      )}

      {activePage.type === "database" && (
        <>
          <DatabaseWorkspace
            pageId={pageId}
            workspaceId={workspaceId}
            mossNoteDockRef={mossNoteDockRef}
          />
          <GroveInsertionToolbar
            onToggleMossNote={() => mossNoteDockRef.current?.togglePlacement()}
          />
        </>
      )}
    </div>
  );
}
