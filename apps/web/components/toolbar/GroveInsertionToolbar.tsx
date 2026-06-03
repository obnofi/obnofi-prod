"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import type { Editor } from "@tiptap/react";
import { Link2, StickyNote } from "lucide-react";
import { SpeechRecognitionButton } from "@/components/editor/SpeechRecognitionButton";
import { LinkEmbedModal } from "@/components/toolbar/LinkEmbedModal";
import { setJungleCursorVariant, useJungleCursor } from "@/lib/cursor/jungleCursor";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

interface GroveInsertionToolbarProps {
  editor?: Editor | null;
  isListening?: boolean;
  isSpeechSupported?: boolean;
  speechListeningState?: ParrotListeningState;
  speechLevel?: number;
  interimTranscript?: string;
  onToggleSpeech?: () => void;
  onToggleMossNote?: () => void;
}

type ToolbarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
};

function ToolbarAnimalIcon({
  alt,
  active = false,
  offSrc,
  onSrc,
}: {
  alt: string;
  active?: boolean;
  offSrc?: string;
  onSrc: string;
}) {
  const src = active || !offSrc ? onSrc : offSrc;

  return (
    <Image
      src={src}
      alt={alt}
      width={25}
      height={19}
      className="h-[19px] w-auto shrink-0 object-contain"
      unoptimized
    />
  );
}

export function GroveInsertionToolbar({
  editor,
  isListening = false,
  isSpeechSupported = false,
  speechListeningState = "idle",
  speechLevel = 0,
  interimTranscript = "",
  onToggleSpeech,
  onToggleMossNote,
}: GroveInsertionToolbarProps) {
  const [isLinkEmbedModalOpen, setIsLinkEmbedModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const canInsert = Boolean(editor?.isEditable);
  const jungleCursor = useJungleCursor();

  const runEditorCommand = (command: (editor: Editor) => void) => {
    if (!editor || !canInsert) return;
    command(editor);
  };

  const handleOwlAi = async () => {
    if (!editor || !canInsert || isAiLoading) return;

    const userPrompt = window.prompt("AI에게 요청할 내용을 입력하세요");
    if (!userPrompt?.trim()) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const contextBefore = editor.state.doc.textBetween(Math.max(0, from - 500), from, " ");

    setIsAiLoading(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt.trim(),
          context: selectedText || contextBefore || undefined,
          command: "continue",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const insertPos = to;
      let currentPos = insertPos;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (!line.startsWith('0:"')) continue;

          const textContent = line.slice(3, -1);
          const unescaped = textContent
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\");

          editor.commands.insertContentAt(currentPos, unescaped);
          currentPos += unescaped.length;
        }
      }

      editor.commands.setTextSelection({ from: currentPos, to: currentPos });
      editor.commands.focus();
    } catch (error) {
      console.error("Toolbar AI error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const items: ToolbarItem[] = [
    {
      id: "monkey",
      label: "Monkey",
      onClick: () =>
        runEditorCommand((activeEditor) => {
          activeEditor.chain().focus().insertCanvasEmbed().run();
        }),
      disabled: !canInsert,
      icon: (
        <ToolbarAnimalIcon
          alt="Monkey"
          onSrc="/toolbar/monkey-on.png"
          offSrc="/toolbar/monkey-off.png"
        />
      ),
    },
    {
      id: "elephant",
      label: "Elephant",
      onClick: () =>
        runEditorCommand((activeEditor) => {
          activeEditor.chain().focus().insertDatabaseEmbed().run();
        }),
      disabled: !canInsert,
      icon: (
        <ToolbarAnimalIcon
          alt="Elephant"
          onSrc="/toolbar/elephant-on.png"
          offSrc="/toolbar/elephant-off.png"
        />
      ),
    },
    {
      id: "owl",
      label: "Owl",
      onClick: handleOwlAi,
      disabled: !canInsert || isAiLoading,
      active: isAiLoading,
      icon: (
        <ToolbarAnimalIcon
          alt="Owl"
          onSrc="/toolbar/owl-on.png"
          offSrc="/toolbar/owl-off.png"
        />
      ),
    },
    {
      id: "moss-note",
      label: "Memo",
      onClick: () => onToggleMossNote?.(),
      disabled: !onToggleMossNote,
      icon: <StickyNote className="h-4 w-4 shrink-0" />,
    },
    {
      id: "link-embed",
      label: "Link",
      onClick: () => {
        if (!canInsert) return;
        setIsLinkEmbedModalOpen(true);
      },
      disabled: !canInsert,
      icon: <Link2 className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <div
      data-export-ignore="true"
      className="pointer-events-none absolute bottom-8 left-1/2 z-30 w-full max-w-[calc(100%-32px)] -translate-x-1/2 px-2"
    >
      <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="flex items-center">
          <button
            type="button"
            data-testid="toolbar-cursor"
            aria-pressed={jungleCursor.variant === "highlighting"}
            aria-label="Cursor"
            onClick={() =>
              setJungleCursorVariant(
                jungleCursor.variant === "highlighting" ? "pointing" : "highlighting"
              )
            }
            title="Cursor"
            className={[
              "flex h-11 min-w-11 items-center justify-center rounded-2xl px-3 text-sm text-[var(--color-text-primary)] transition",
              jungleCursor.variant === "highlighting"
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
                : "hover:bg-[var(--color-hover)]",
            ].join(" ")}
          >
            <ToolbarAnimalIcon
              alt="Cursor"
              active={jungleCursor.variant === "highlighting"}
              onSrc="/toolbar/cursor-highlighting.png"
              offSrc="/toolbar/cursor-off.png"
            />
          </button>
        </div>
        {onToggleSpeech ? (
          <SpeechRecognitionButton
            isListening={isListening}
            isSupported={isSpeechSupported}
            listeningState={speechListeningState}
            speechLevel={speechLevel}
            interimTranscript={interimTranscript}
            onToggle={() => onToggleSpeech?.()}
          />
        ) : null}
        {items.map(({ id, label, icon, onClick, disabled, active }) => (
          <button
            key={id}
            type="button"
            data-testid={`toolbar-${id}`}
            aria-pressed={active}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            title={label}
            className={[
              "flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm text-[var(--color-text-primary)] transition",
              active
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
                : "hover:bg-[var(--color-hover)]",
              disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
            ].join(" ")}
          >
            {icon}
          </button>
        ))}
      </div>
      <LinkEmbedModal
        isOpen={isLinkEmbedModalOpen}
        onClose={() => setIsLinkEmbedModalOpen(false)}
        onConfirm={(url) => {
          editor?.chain().focus().insertLinkEmbedBlock({ url }).run();
        }}
      />
    </div>
  );
}
