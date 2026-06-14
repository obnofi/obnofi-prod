"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { CodeBlock } from "@/components/editor/extensions/CodeBlock";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PublicReadonlyCodeBlock } from "./PublicReadonlyCodeBlock";
import { createGroveEditorExtensions } from "@/hooks/useGroveEditorExtensions";

interface PublicReadonlyEditorProps {
  content: object | null;
}

export function PublicReadonlyEditor({ content }: PublicReadonlyEditorProps) {
  const readonlyCodeBlock = CodeBlock.extend({
    addNodeView() {
      return ReactNodeViewRenderer(PublicReadonlyCodeBlock);
    },
  });

  const editor = useEditor({
    extensions: createGroveEditorExtensions({
      ydoc: null,
      provider: null,
      lineIndicatorEnabled: false,
      editable: false,
      placeholder: "",
      onLinkDatabase: () => {},
      onInsertButton: () => {},
      onInsertPageLink: () => {},
      onInsertPageMention: () => {},
      userColor: () => "#2B593F",
      codeBlockExtension: readonlyCodeBlock,
    }),
    content: content || { type: "doc", content: [{ type: "paragraph" }] },
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Published Grove content",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextContent = content || { type: "doc", content: [{ type: "paragraph" }] };
    const currentContent = editor.getJSON();

    if (JSON.stringify(currentContent) === JSON.stringify(nextContent)) {
      return;
    }

    editor.commands.setContent(nextContent, { emitUpdate: false });
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor prose max-w-none text-[var(--color-text-primary)] dark:prose-invert [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-[var(--color-text-primary)]">
      <EditorContent editor={editor} />
    </div>
  );
}
