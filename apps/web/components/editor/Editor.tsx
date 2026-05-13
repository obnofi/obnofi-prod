"use client";

import { useState, useCallback, useRef, useEffect, type CSSProperties } from "react";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import { GroveCollaborationCursor } from "@/components/editor/extensions/GroveCollaborationCursor";
import { useCollaboration, userColor } from "@/lib/collaboration/CollaborationContext";
import "tippy.js/dist/tippy.css";
import { useSession } from "next-auth/react";
import { DatabaseBlock } from "@/components/editor/extensions/DatabaseBlock";
import { CanvasBlock } from "@/components/editor/extensions/CanvasBlock";
import { ButtonBlock } from "@/components/editor/extensions/ButtonBlock";
import { CodeBlock } from "@/components/editor/extensions/CodeBlock";
import {
  ColumnLayoutBlock,
  GroveColumn,
} from "@/components/editor/extensions/ColumnLayoutBlock";
import { LinkedDatabaseBlock } from "@/components/editor/extensions/LinkedDatabaseBlock";
import { MathBlock } from "@/components/editor/extensions/MathBlock";
import { SlashCommandExtension } from "@/components/editor/extensions/SlashCommandExtension";
import {
  CustomEmojiNode,
  PersonalEmojiExtension,
} from "@/components/editor/extensions/PersonalEmojiExtension";
import { LinkDatabaseModal } from "@/components/editor/extensions/LinkDatabaseModal";
import { ButtonInsertModal } from "@/components/editor/extensions/ButtonInsertModal";
import { PageLinkModal } from "@/components/editor/extensions/PageLinkModal";
import { PageLinkExtension } from "@/components/editor/extensions/PageLinkExtension";
import { PageLinkMark } from "@/components/editor/extensions/PageMentionExtension";
import { DbDiagramExtension } from "@/src/components/editor/extensions/DbDiagramExtension";
import { SubPageBlock } from "@/components/editor/extensions/SubPageBlock";
import { BlockActionsExtension } from "@/components/editor/extensions/BlockActionsExtension";
import { BlockActionBar } from "@/components/editor/BlockActionBar";
import { CollaboratorBlockAvatars } from "@/components/editor/CollaboratorBlockAvatars";
import { SpeechRecognitionButton } from "@/components/editor/SpeechRecognitionButton";
import { SpeechInputIndicator } from "@/components/editor/SpeechInputIndicator";
import { TextHighlightToolbar } from "@/components/editor/TextHighlightToolbar";
import { TextHighlightMark } from "@/components/editor/extensions/TextHighlightMark";
import { TaskItem, TaskList } from "@/components/editor/extensions/TaskList";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { PageHeadingFontSizes, PageHighlightColor } from "@obnofi/types";

interface EditorProps {
  content: object | null;
  bodyFontSizePt?: number;
  headingFontSizes?: PageHeadingFontSizes;
  highlightColors?: PageHighlightColor[];
  pageUpdatedAt?: string;
  yjsUpdatedAt?: string | null;
  editable?: boolean;
  /** 에디터 내용 변경 시 호출 — 최신 JSON content 전달 */
  onUpdate?: (content: object) => void;
  /** 변경 발생 알림 (자동저장 트리거용) */
  onEdit?: () => void;
  placeholder?: string;
  workspaceId?: string;
  pageId?: string;
  onContentContainerReady?: (node: HTMLDivElement | null) => void;
  onEditorReady?: (editor: TiptapEditor | null) => void;
}

function tiptapDocumentsMatch(a: object | null, b: object | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function Editor({
  content,
  bodyFontSizePt = 12,
  headingFontSizes = { h1: 30, h2: 23, h3: 18, h4: 16, h5: 14 },
  highlightColors = ["yellow", "green", "blue", "pink"],
  pageUpdatedAt,
  yjsUpdatedAt,
  editable = true,
  onUpdate,
  onEdit,
  placeholder = "Type something...",
  workspaceId,
  pageId,
  onContentContainerReady,
  onEditorReady,
}: EditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [isPageLinkModalOpen, setIsPageLinkModalOpen] = useState(false);
  const editorRef = useRef<TiptapEditor | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onEditRef = useRef(onEdit);

  // Yjs sync 완료 전 setContent로 인한 가짜 onUpdate 방지
  const isApplyingInitialContent = useRef(false);
  const initialContentApplied = useRef(false);

  const { data: session } = useSession();
  const { ydoc, provider, isSynced } = useCollaboration();

  const handleSpeechFinalResult = useCallback((text: string) => {
    editorRef.current?.chain().focus().insertContent(text).run();
  }, []);

  const handleEditorShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorShellRef.current = node;
      onContentContainerReady?.(node);
    },
    [onContentContainerReady]
  );

  const { interimTranscript, isListening, isSupported, start, stop } =
    useSpeechRecognition({ onFinalResult: handleSpeechFinalResult });

  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onEditRef.current = onEdit; }, [onEdit]);
  useEffect(() => { onEditorReady?.(editorRef.current); }, [onEditorReady]);

  // 협업 문서가 비어 있거나 ws-server가 persisted Yjs를 복원하지 못한 경우,
  // page content를 먼저 Yjs 문서에 심어 문서가 빈 화면으로 열리지 않게 한다.
  useEffect(() => {
    if (!ydoc || initialContentApplied.current) return;
    const editor = editorRef.current;
    if (!editor || !content) return;

    const pageUpdatedAtMs = pageUpdatedAt ? new Date(pageUpdatedAt).getTime() : 0;
    const yjsUpdatedAtMs = yjsUpdatedAt ? new Date(yjsUpdatedAt).getTime() : 0;
    const shouldSeedFromPage =
      !yjsUpdatedAt || pageUpdatedAtMs > yjsUpdatedAtMs;

    if (!shouldSeedFromPage) {
      return;
    }

    const editorJson = editor.getJSON() as { content?: Array<{ type?: string; content?: unknown[] }> };
    const docContent = editorJson.content ?? [];
    const isEmpty =
      docContent.length === 0 ||
      (docContent.length === 1 &&
        docContent[0]?.type === "paragraph" &&
        !docContent[0]?.content?.length);

    const dbContent = content as { content?: unknown[] };
    if (!isEmpty || !dbContent.content?.length) {
      return;
    }

    initialContentApplied.current = true;
    isApplyingInitialContent.current = true;
    editor.commands.setContent(content);
    setTimeout(() => { isApplyingInitialContent.current = false; }, 0);
  }, [content, pageUpdatedAt, ydoc, yjsUpdatedAt]);

  // 협업 모드: sync 완료 후 Yjs 문서가 비어있으면 DB content로 초기화
  useEffect(() => {
    if (!isSynced || !ydoc || initialContentApplied.current) return;
    const editor = editorRef.current;
    if (!editor || !content) return;

    const editorJson = editor.getJSON();
    if (tiptapDocumentsMatch(editorJson as object, content)) {
      initialContentApplied.current = true;
      return;
    }

    const docContent = editorJson.content ?? [];
    const isEmpty =
      docContent.length === 0 ||
      (docContent.length === 1 &&
        docContent[0].type === "paragraph" &&
        !docContent[0].content?.length);

    const dbContent = content as { content?: unknown[] };
    const pageUpdatedAtMs = pageUpdatedAt ? new Date(pageUpdatedAt).getTime() : 0;
    const yjsUpdatedAtMs = yjsUpdatedAt ? new Date(yjsUpdatedAt).getTime() : 0;
    const shouldRestoreFromPage =
      pageUpdatedAtMs > yjsUpdatedAtMs ||
      (isEmpty && dbContent?.content && dbContent.content.length > 0);

    if (shouldRestoreFromPage && dbContent?.content && dbContent.content.length > 0) {
      initialContentApplied.current = true;
      isApplyingInitialContent.current = true;
      editor.commands.setContent(content);
      setTimeout(() => { isApplyingInitialContent.current = false; }, 0);
    } else {
      initialContentApplied.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, isSynced, pageUpdatedAt, ydoc, yjsUpdatedAt]);

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

  const handleOpenLinkModal = useCallback(() => setIsLinkModalOpen(true), []);
  const handleOpenButtonModal = useCallback(() => setIsButtonModalOpen(true), []);
  const handleOpenPageLinkModal = useCallback(() => setIsPageLinkModalOpen(true), []);
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure(ydoc ? { undoRedo: false } : {}),
      Placeholder.configure({ placeholder }),
      TextHighlightMark,
      TaskList,
      TaskItem,
      ...(ydoc && provider
        ? [
            Collaboration.configure({ document: ydoc }),
            GroveCollaborationCursor.configure({
              awareness: provider.awareness,
              user: {
                name: session?.user?.name ?? "Anonymous",
                color: userColor(session?.user?.email ?? ""),
                image: session?.user?.image ?? null,
              },
            }),
          ]
        : []),
      DatabaseBlock.configure({ workspaceId, pageId }),
      CanvasBlock.configure({ workspaceId, pageId }),
      ButtonBlock,
      CodeBlock,
      GroveColumn,
      ColumnLayoutBlock,
      MathBlock,
      LinkedDatabaseBlock.configure({ workspaceId, pageId }),
      CustomEmojiNode,
      PersonalEmojiExtension,
      DbDiagramExtension.configure({ workspaceId, pageId }),
      PageLinkExtension,
      PageLinkMark.configure({ workspaceId }),
      SubPageBlock,
      ...(editable ? [BlockActionsExtension] : []),
      SlashCommandExtension.configure({
        workspaceId,
        pageId,
        onLinkDatabase: handleOpenLinkModal,
        onInsertButton: handleOpenButtonModal,
        onInsertPageLink: handleOpenPageLinkModal,
      }),
    ],
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

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    return () => {
      const shell = editorShellRef.current;
      if (!shell) {
        return;
      }

      shell
        .querySelectorAll(".collaboration-cursor__caret")
        .forEach((node) => node.remove());
    };
  }, []);

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
          } as CSSProperties
        }
        className={`editor prose max-w-none text-[#111110] dark:prose-invert dark:text-zinc-100 [&:focus-within]:outline-none [&_*]:focus-visible:outline-none ${
          editable ? "cursor-text" : ""
        }`}
      >
        {editable && (
          <div className="not-prose flex justify-end pb-1">
            <SpeechRecognitionButton
              isListening={isListening}
              isSupported={isSupported}
              onToggle={isListening ? stop : start}
            />
          </div>
        )}
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
          <CollaboratorBlockAvatars
            editor={editor}
            container={editorShellRef.current}
          />
        ) : null}
        <SpeechInputIndicator
          isListening={isListening}
          interimTranscript={interimTranscript}
        />
      </div>

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
