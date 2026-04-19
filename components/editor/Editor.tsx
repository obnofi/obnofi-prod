"use client";

import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { DatabaseBlock } from "@/components/editor/extensions/DatabaseBlock";
import { CanvasBlock } from "@/components/editor/extensions/CanvasBlock";
import { ButtonBlock } from "@/components/editor/extensions/ButtonBlock";
import { LinkedDatabaseBlock } from "@/components/editor/extensions/LinkedDatabaseBlock";
import { SlashCommandExtension } from "@/components/editor/extensions/SlashCommandExtension";
import { LinkDatabaseModal } from "@/components/editor/extensions/LinkDatabaseModal";
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
      LinkedDatabaseBlock.configure({
        workspaceId,
        pageId,
      }),
      SlashCommandExtension.configure({
        workspaceId,
        pageId,
        onLinkDatabase: handleOpenLinkModal,
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
        className={`editor prose max-w-none text-[#111110] dark:prose-invert dark:text-zinc-100 ${
          editable ? "cursor-text" : ""
        }`}
      >
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:text-[#111110] [&_.ProseMirror]:outline-none dark:[&_.ProseMirror]:text-zinc-100 [&_.ProseMirror-focused]:outline-none [&_.ProseMirror-placeholder]:text-zinc-400 [&_.ProseMirror-placeholder]:before:content-[attr(data-placeholder)] [&_.ProseMirror-placeholder]:before:pointer-events-none"
        />
      </div>

      <LinkDatabaseModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSelect={handleDatabaseSelect}
        workspaceId={workspaceId ?? ""}
      />
    </>
  );
}
