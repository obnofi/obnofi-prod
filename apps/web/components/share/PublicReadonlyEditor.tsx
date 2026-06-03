"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ButtonBlock } from "@/components/editor/extensions/ButtonBlock";
import { CodeBlock } from "@/components/editor/extensions/CodeBlock";
import { TaskItem, TaskList } from "@/components/editor/extensions/TaskList";
import { TextHighlightMark } from "@/components/editor/extensions/TextHighlightMark";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PublicReadonlyCodeBlock } from "./PublicReadonlyCodeBlock";

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
    extensions: [
      StarterKit,
      TextHighlightMark,
      TaskList,
      TaskItem,
      ButtonBlock,
      readonlyCodeBlock,
    ],
    content: content || { type: "doc", content: [{ type: "paragraph" }] },
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Published Grove content",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="editor prose max-w-none text-[#111110] dark:prose-invert dark:text-zinc-100 [&_.ProseMirror]:outline-none dark:[&_.ProseMirror]:text-zinc-100">
      <EditorContent editor={editor} />
    </div>
  );
}
