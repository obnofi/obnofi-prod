"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import type { Editor } from "@tiptap/react";
import { StickyNote } from "lucide-react";
import { SpeechRecognitionButton } from "@/components/editor/SpeechRecognitionButton";
import { OwlChatPanel } from "@/components/editor/OwlChatPanel";
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
  tooltip: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  iconOnlyToggle?: boolean;
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
  onToggleSpeech,
  onToggleMossNote,
}: GroveInsertionToolbarProps) {
  const [isOwlOpen, setIsOwlOpen] = useState(false);
  const [isSpeechToolbarSettling, setIsSpeechToolbarSettling] = useState(false);
  const canInsert = Boolean(editor?.isEditable);
  const jungleCursor = useJungleCursor();
  const wasListeningRef = useRef(isListening);

  useEffect(() => {
    if (!isListening && wasListeningRef.current) {
      setIsSpeechToolbarSettling(true);
      const settleTimer = window.setTimeout(() => {
        setIsSpeechToolbarSettling(false);
      }, 360);
      wasListeningRef.current = isListening;
      return () => window.clearTimeout(settleTimer);
    }

    if (isListening) {
      setIsSpeechToolbarSettling(false);
    }

    wasListeningRef.current = isListening;
    return undefined;
  }, [isListening]);

  const isSpeechToolbarListening = isListening;
  const isSpeechToolbarSettlingOnly = !isListening && isSpeechToolbarSettling;

  const runEditorCommand = (command: (editor: Editor) => void) => {
    if (!editor || !canInsert) return;
    command(editor);
  };

  const handleOwlAi = () => {
    if (!canInsert) return;
    setIsOwlOpen((prev) => !prev);
  };

  const items: ToolbarItem[] = [
    {
      id: "monkey",
      label: "Clearing",
      tooltip: "Clearing 캔버스 삽입",
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
      label: "Undergrowth",
      tooltip: "Undergrowth 데이터베이스 삽입",
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
      label: "Owl AI",
      tooltip: "Owl AI 열기",
      onClick: handleOwlAi,
      disabled: !canInsert,
      active: isOwlOpen,
      iconOnlyToggle: true,
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
      label: "MossNote",
      tooltip: "MossNote 배치",
      onClick: () => onToggleMossNote?.(),
      disabled: !onToggleMossNote,
      icon: <StickyNote className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <div
      data-export-ignore="true"
      className="pointer-events-none absolute bottom-8 left-1/2 z-30 w-full max-w-[calc(100%-32px)] -translate-x-1/2 px-2"
    >
      <div
        className={[
          "pointer-events-auto mx-auto flex max-w-full items-center overflow-hidden transition-all duration-300 ease-out",
          isSpeechToolbarListening
            ? "w-fit justify-center border-transparent bg-transparent px-0 py-0 shadow-none backdrop-blur-0"
            : isSpeechToolbarSettlingOnly
              ? "h-16 w-16 justify-center rounded-full border border-[var(--color-accent)] bg-[var(--color-surface)]/95 px-1 py-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl"
              : "w-fit gap-1 overflow-x-auto rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl",
        ].join(" ")}
      >
        {isSpeechToolbarListening ? (
          onToggleSpeech ? (
            <SpeechRecognitionButton
              isListening={isListening}
              isSupported={isSpeechSupported}
              listeningState={speechListeningState}
              speechLevel={speechLevel}
              onToggle={() => onToggleSpeech?.()}
            />
          ) : null
        ) : isSpeechToolbarSettlingOnly ? (
          <span
            aria-hidden="true"
            className="h-10 w-10 rounded-full bg-[var(--color-accent)]"
          />
        ) : (
          <>
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
                title="하이라이트 커서"
                className={[
                  "flex h-11 min-w-11 items-center justify-center rounded-2xl px-3 text-sm text-[var(--color-text-primary)] transition",
                  "hover:bg-[var(--color-hover)]",
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
                onToggle={() => onToggleSpeech?.()}
              />
            ) : null}
            {items.map(({ id, label, tooltip, icon, onClick, disabled, active, iconOnlyToggle }) => (
              <button
                key={id}
                type="button"
                data-testid={`toolbar-${id}`}
                aria-pressed={active}
                aria-label={label}
                disabled={disabled}
                onClick={onClick}
                title={tooltip}
                className={[
                  "flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm text-[var(--color-text-primary)] transition",
                  active && !iconOnlyToggle
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
                    : "hover:bg-[var(--color-hover)]",
                  disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
                ].join(" ")}
              >
                {icon}
              </button>
            ))}
          </>
        )}
      </div>
      {isOwlOpen && (
        <OwlChatPanel editor={editor} onClose={() => setIsOwlOpen(false)} />
      )}
    </div>
  );
}
