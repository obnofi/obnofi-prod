"use client";

import { useState, useCallback, useRef, useEffect, type CSSProperties, type Ref, type RefObject } from "react";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import { useCollaboration, userColor } from "@/lib/collaboration/CollaborationContext";
import "tippy.js/dist/tippy.css";
import { useSession } from "next-auth/react";
import { LinkDatabaseModal } from "@/components/editor/extensions/LinkDatabaseModal";
import { ButtonInsertModal } from "@/components/editor/extensions/ButtonInsertModal";
import { PageLinkModal } from "@/components/editor/extensions/PageLinkModal";
import { BlockActionBar } from "@/components/editor/BlockActionBar";
import { CollaboratorBlockAvatars } from "@/components/editor/CollaboratorBlockAvatars";
import { SpeechInputIndicator } from "@/components/editor/SpeechInputIndicator";
import { TextHighlightToolbar } from "@/components/editor/TextHighlightToolbar";
import { RemotePageCursors } from "@/components/editor/RemotePageCursors";
import {
  MossNoteDock,
  type MossNoteDockHandle,
} from "@/components/workspace/MossNoteDock";
import { useEditorContentSync } from "@/hooks/useEditorContentSync";
import { useGroveEditorExtensions } from "@/hooks/useGroveEditorExtensions";
import { usePageCursorTracking } from "@/hooks/usePageCursorTracking";
import { useJungleCursor } from "@/lib/cursor/jungleCursor";
import type { PageHeadingFontSizes, PageHighlightColor } from "@obnofi/types";
import type { MossNoteAnchor } from "@/lib/moss-notes";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

interface EditorProps {
  content: object | null;
  bodyFontSizePt?: number;
  headingFontSizes?: PageHeadingFontSizes;
  highlightColors?: PageHighlightColor[];
  pageUpdatedAt?: string;
  yjsUpdatedAt?: string | null;
  editable?: boolean;
  lineIndicatorEnabled?: boolean;
  /** 에디터 내용 변경 시 호출 — 최신 JSON content 전달 */
  onUpdate?: (content: object) => void;
  /** 변경 발생 알림 (자동저장 트리거용) */
  onEdit?: () => void;
  placeholder?: string;
  workspaceId?: string;
  pageId?: string;
  onContentContainerReady?: (node: HTMLDivElement | null) => void;
  onEditorReady?: (editor: TiptapEditor | null) => void;
  interimTranscript?: string;
  isSpeechListening?: boolean;
  speechListeningState?: ParrotListeningState;
  mossNoteDockRef?: Ref<MossNoteDockHandle>;
  mossNoteSurfaceRef?: RefObject<HTMLElement>;
}

export function Editor({
  content,
  bodyFontSizePt = 12,
  headingFontSizes = { h1: 30, h2: 23, h3: 18, h4: 16, h5: 14 },
  highlightColors = ["yellow", "green", "blue", "pink"],
  pageUpdatedAt,
  yjsUpdatedAt,
  editable = true,
  lineIndicatorEnabled = false,
  onUpdate,
  onEdit,
  placeholder = "Type something...",
  workspaceId,
  pageId,
  onContentContainerReady,
  onEditorReady,
  interimTranscript = "",
  isSpeechListening = false,
  speechListeningState = "idle",
  mossNoteDockRef,
  mossNoteSurfaceRef,
}: EditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [isPageLinkModalOpen, setIsPageLinkModalOpen] = useState(false);
  const editorRef = useRef<TiptapEditor | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onEditRef = useRef(onEdit);
  const jungleCursor = useJungleCursor();

  const { data: session } = useSession();
  const { ydoc, provider, isSynced, awarenessStates, localUserId, updateCursor } = useCollaboration();

  const handleEditorShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorShellRef.current = node;
      onContentContainerReady?.(node);
    },
    [onContentContainerReady]
  );

  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onEditRef.current = onEdit; }, [onEdit]);
  useEffect(() => { onEditorReady?.(editorRef.current); }, [onEditorReady]);
  const isApplyingInitialContent = useRef(false);

  const handleOpenLinkModal = useCallback(() => setIsLinkModalOpen(true), []);
  const handleOpenButtonModal = useCallback(() => setIsButtonModalOpen(true), []);
  const handleOpenPageLinkModal = useCallback(() => setIsPageLinkModalOpen(true), []);

  const extensions = useGroveEditorExtensions({
    ydoc,
    provider,
    lineIndicatorEnabled,
    editable,
    placeholder,
    workspaceId,
    pageId,
    sessionUserName: session?.user?.name ?? undefined,
    sessionUserEmail: session?.user?.email ?? undefined,
    sessionUserImage: session?.user?.image ?? null,
    userColor,
    onLinkDatabase: handleOpenLinkModal,
    onInsertButton: handleOpenButtonModal,
    onInsertPageLink: handleOpenPageLinkModal,
  });

  const handleDatabaseSelect = useCallback(
    (databaseId: string, selectedPageId: string) => {
      editorRef.current
        ?.chain()
        .focus()
        .insertContent({
          type: "linkedDatabaseEmbed",
          attrs: { databaseId, pageId: selectedPageId, workspaceId: workspaceId ?? null },
        })
        .run();
    },
    [workspaceId]
  );

  const handleButtonInsert = useCallback((label: string, url: string) => {
    editorRef.current?.commands.insertButtonBlock({ label, url });
  }, []);

  const handlePageLinkInsert = useCallback(
    (selectedPageId: string, selectedPageTitle: string) => {
      editorRef.current?.commands.insertPageLink({
        pageId: selectedPageId,
        pageTitle: selectedPageTitle,
        workspaceId: workspaceId ?? "",
      });
    },
    [workspaceId]
  );

  const getMossNoteAnchor = useCallback((): MossNoteAnchor => {
    const activeEditor = editorRef.current;
    if (!activeEditor) return { kind: "page" };
    const { from, to, empty } = activeEditor.state.selection;
    if (empty) return { kind: "page" };
    const quote = activeEditor.state.doc.textBetween(from, to, " ").trim();
    if (!quote) return { kind: "page" };
    return { kind: "selection", quote, from, to };
  }, []);

  const revealMossNoteAnchor = useCallback((anchor: MossNoteAnchor) => {
    const activeEditor = editorRef.current;
    if (!activeEditor || anchor.kind !== "selection") return;
    const docSize = activeEditor.state.doc.content.size;
    const from = Math.max(1, Math.min(anchor.from ?? 1, docSize));
    const to = Math.max(from, Math.min(anchor.to ?? from, docSize));
    activeEditor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run();
  }, []);

  const editor = useEditor({
    extensions,
    content: ydoc
      ? undefined
      : content || { type: "doc", content: [{ type: "paragraph" }] },
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "data-testid": "workspace-editor-input",
        "aria-label": "Document editor",
      },
    },
    onUpdate: ({ editor }) => {
      if (isApplyingInitialContent.current) return;
      const json = editor.getJSON();
      onUpdateRef.current?.(json);
      onEditRef.current?.();
    },
  });

  editorRef.current = editor ?? null;

  useEditorContentSync({
    editor,
    content,
    pageUpdatedAt,
    yjsUpdatedAt,
    ydoc: ydoc ?? null,
    isSynced,
    isApplyingInitialContent,
  });

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    return () => {
      const shell = editorShellRef.current;
      if (!shell) return;
      shell
        .querySelectorAll(".collaboration-cursor__caret")
        .forEach((node) => node.remove());
    };
  }, []);

  const { remotePageCursors, handlePagePointerMove, clearPagePointer } = usePageCursorTracking({
    ydoc,
    provider,
    pageId,
    localUserId,
    awarenessStates,
    updateCursor,
    editorShellRef,
  });

  if (!editor) return null;

  return (
    <>
      <div
        data-testid="workspace-editor"
        ref={handleEditorShellRef}
        style={
          {
            "--grove-body-font-size": `${bodyFontSizePt}pt`,
            "--grove-h1-font-size": `${headingFontSizes.h1}pt`,
            "--grove-h2-font-size": `${headingFontSizes.h2}pt`,
            "--grove-h3-font-size": `${headingFontSizes.h3}pt`,
            "--grove-h4-font-size": `${headingFontSizes.h4}pt`,
            "--grove-h5-font-size": `${headingFontSizes.h5}pt`,
            cursor: jungleCursor.cursorCss,
          } as CSSProperties
        }
        className={`editor relative prose max-w-none text-[#111110] dark:prose-invert dark:text-zinc-100 [&:focus-within]:outline-none [&_*]:focus-visible:outline-none ${
          editable ? "cursor-text" : ""
        } ${lineIndicatorEnabled && ydoc ? "pl-4" : ""}`}
        onPointerMove={handlePagePointerMove}
        onPointerLeave={clearPagePointer}
      >
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:text-[#111110] [&_.ProseMirror]:outline-none dark:[&_.ProseMirror]:text-zinc-100 [&_.ProseMirror-focused]:outline-none [&_.ProseMirror-focused]:ring-0 [&_.ProseMirror-focused]:border-transparent [&_.ProseMirror-placeholder]:text-zinc-400 [&_.ProseMirror-placeholder]:before:content-[attr(data-placeholder)] [&_.ProseMirror-placeholder]:before:pointer-events-none"
        />
        {editable ? (
          <BlockActionBar editor={editor} container={editorShellRef.current} />
        ) : null}
        {editable ? (
          <TextHighlightToolbar editor={editor} colors={highlightColors} />
        ) : null}
        {ydoc && provider ? (
          <CollaboratorBlockAvatars editor={editor} container={editorShellRef.current} />
        ) : null}
        <RemotePageCursors states={remotePageCursors} />
        <SpeechInputIndicator
          isListening={isSpeechListening}
          interimTranscript={interimTranscript}
          listeningState={speechListeningState}
        />
      </div>

      {editable && pageId ? (
        <MossNoteDock
          ref={mossNoteDockRef}
          pageId={pageId}
          surfaceRef={mossNoteSurfaceRef ?? editorShellRef}
          getAnchor={getMossNoteAnchor}
          onRevealAnchor={revealMossNoteAnchor}
        />
      ) : null}

      <LinkDatabaseModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSelect={handleDatabaseSelect}
        workspaceId={workspaceId ?? ""}
      />
      <ButtonInsertModal
        isOpen={isButtonModalOpen}
        onClose={() => setIsButtonModalOpen(false)}
        onConfirm={handleButtonInsert}
      />
      <PageLinkModal
        isOpen={isPageLinkModalOpen}
        onClose={() => setIsPageLinkModalOpen(false)}
        onSelect={handlePageLinkInsert}
        workspaceId={workspaceId ?? ""}
      />
    </>
  );
}
