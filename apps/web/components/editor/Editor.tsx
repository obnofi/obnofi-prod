"use client";

import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "tippy.js/dist/tippy.css";
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
import type { Editor as TiptapEditor } from "@tiptap/core";

interface EditorProps {
  content: object | null;
  editable?: boolean;
  onUpdate?: (content: object) => void;
  placeholder?: string;
  workspaceId?: string;
  pageId?: string;
}

export function Editor({
  content,
  editable = true,
  onUpdate,
  placeholder = "Type something...",
  workspaceId,
  pageId,
}: EditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [isPageLinkModalOpen, setIsPageLinkModalOpen] = useState(false);
  const editorRef = useRef<TiptapEditor | null>(null);

  const handleDatabaseSelect = useCallback(
    (databaseId: string, selectedPageId: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "linkedDatabaseEmbed",
          attrs: {
            databaseId,
            pageId: selectedPageId,
            workspaceId: workspaceId ?? null,
          },
        })
        .run();
    },
    [workspaceId]
  );

  const handleOpenLinkModal = useCallback(() => {
    setIsLinkModalOpen(true);
  }, []);

  const handleOpenButtonModal = useCallback(() => {
    setIsButtonModalOpen(true);
  }, []);

  const handleOpenPageLinkModal = useCallback(() => {
    setIsPageLinkModalOpen(true);
  }, []);

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
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      DatabaseBlock.configure({
        workspaceId,
        pageId,
      }),
      CanvasBlock.configure({
        workspaceId,
        pageId,
      }),
      ButtonBlock,
      CodeBlock,
      GroveColumn,
      ColumnLayoutBlock,
      MathBlock,
      LinkedDatabaseBlock.configure({
        workspaceId,
        pageId,
      }),
      CustomEmojiNode,
      PersonalEmojiExtension,
      DbDiagramExtension.configure({
        workspaceId,
        pageId,
      }),
      PageLinkExtension,
      PageLinkMark.configure({ workspaceId }),
      SubPageBlock,
      SlashCommandExtension.configure({
        workspaceId,
        pageId,
        onLinkDatabase: handleOpenLinkModal,
        onInsertButton: handleOpenButtonModal,
        onInsertPageLink: handleOpenPageLinkModal,
      }),
    ],
    content: content || {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "data-testid": "workspace-editor-input",
        "aria-label": "Document editor",
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getJSON());
      }
    },
  });

  editorRef.current = editor ?? null;

  if (!editor) {
    return null;
  }

  return (
    <>
      <div
        data-testid="workspace-editor"
        className={`editor prose max-w-none text-[#111110] dark:prose-invert dark:text-zinc-100 [&:focus-within]:outline-none [&_*]:focus-visible:outline-none ${
          editable ? "cursor-text" : ""
        }`}
      >
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:text-[#111110] [&_.ProseMirror]:outline-none dark:[&_.ProseMirror]:text-zinc-100 [&_.ProseMirror-focused]:outline-none [&_.ProseMirror-focused]:ring-0 [&_.ProseMirror-focused]:border-transparent [&_.ProseMirror-placeholder]:text-zinc-400 [&_.ProseMirror-placeholder]:before:content-[attr(data-placeholder)] [&_.ProseMirror-placeholder]:before:pointer-events-none"
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
