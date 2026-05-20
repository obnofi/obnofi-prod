"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import {
  Code2,
  Database,
  FileUp,
  Link2,
  Mic,
  PenLine,
  Sigma,
  StickyNote,
  Globe,
  X,
} from "lucide-react";

interface GroveInsertionToolbarProps {
  editor?: Editor | null;
  isListening?: boolean;
  isSpeechSupported?: boolean;
  onToggleSpeech?: () => void;
  onToggleMossNote?: () => void;
}

type ToolbarItem = {
  id: string;
  Icon: typeof Mic;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
};

function normalizeUrl(input: string | null) {
  const trimmed = input?.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

interface LinkEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

function LinkEmbedModal({ isOpen, onClose, onConfirm }: LinkEmbedModalProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedUrl = normalizeUrl(url);

  useEffect(() => {
    if (!isOpen) return;

    setUrl("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleConfirm = () => {
    if (!normalizedUrl) return;

    onConfirm(normalizedUrl);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleConfirm();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[1000] flex items-start justify-center pt-[22vh]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            링크 임베드
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-1.5 px-4 py-4">
          <label
            htmlFor="grove-link-embed-url"
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            링크
          </label>
          <input
            id="grove-link-embed-url"
            name="grove-link-embed-url"
            ref={inputRef}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!normalizedUrl}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function GroveInsertionToolbar({
  editor,
  isListening = false,
  isSpeechSupported = false,
  onToggleSpeech,
  onToggleMossNote,
}: GroveInsertionToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLinkEmbedModalOpen, setIsLinkEmbedModalOpen] = useState(false);
  const canInsert = Boolean(editor?.isEditable);

  const runEditorCommand = (command: (editor: Editor) => void) => {
    if (!editor || !canInsert) return;
    command(editor);
  };

  const items: ToolbarItem[] = [
    {
      id: "parrot",
      Icon: Mic,
      onClick: () => onToggleSpeech?.(),
      disabled: !onToggleSpeech || !isSpeechSupported,
      active: isListening,
    },
    {
      id: "moss-note",
      Icon: StickyNote,
      onClick: () => onToggleMossNote?.(),
      disabled: !onToggleMossNote,
    },
    {
      id: "code",
      Icon: Code2,
      onClick: () =>
        runEditorCommand((activeEditor) => {
          const chain = activeEditor.chain().focus();
          (chain as typeof chain & { insertCodeBlock: () => typeof chain })
            .insertCodeBlock()
            .run();
        }),
      disabled: !canInsert,
    },
    {
      id: "math",
      Icon: Sigma,
      onClick: () =>
        runEditorCommand((activeEditor) => {
          activeEditor.chain().focus().insertMathBlock().run();
        }),
      disabled: !canInsert,
    },
    {
      id: "clearing-drawing",
      Icon: PenLine,
      onClick: () =>
        runEditorCommand((activeEditor) => {
          activeEditor.chain().focus().insertCanvasEmbed().run();
        }),
      disabled: !canInsert,
    },
    {
      id: "undergrowth",
      Icon: Database,
      onClick: () =>
        runEditorCommand((activeEditor) => {
          activeEditor.chain().focus().insertDatabaseEmbed().run();
        }),
      disabled: !canInsert,
    },
    {
      id: "file-drop",
      Icon: FileUp,
      onClick: () => {
        if (!canInsert) return;
        fileInputRef.current?.click();
      },
      disabled: !canInsert,
    },
    {
      id: "link-embed",
      Icon: Link2,
      onClick: () => {
        if (!canInsert) return;
        setIsLinkEmbedModalOpen(true);
      },
      disabled: !canInsert,
    },
    {
      id: "web-clipping",
      Icon: Globe,
      onClick: () =>
        runEditorCommand((activeEditor) => {
          const url = normalizeUrl(window.prompt("클리핑할 웹 주소를 입력하세요"));
          if (!url) return;
          activeEditor.chain().focus().insertWebClipBlock({ url, note: "" }).run();
        }),
      disabled: !canInsert,
    },
  ];

  return (
    <div
      data-export-ignore="true"
      className="pointer-events-none absolute bottom-8 left-1/2 z-30 w-full max-w-[calc(100%-32px)] -translate-x-1/2 px-2"
    >
      <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        {items.map(({ id, Icon, onClick, disabled, active }) => (
          <button
            key={id}
            type="button"
            data-testid={`toolbar-${id}`}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={[
              "flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm text-[var(--color-text-primary)] transition",
              active
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
                : "hover:bg-[var(--color-hover)]",
              disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
            ].join(" ")}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </button>
        ))}
      </div>
      <input
        ref={fileInputRef}
        name="grove-file-upload"
        className="hidden"
        type="file"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []).map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          }));
          if (files.length) {
            editor?.chain().focus().insertFileDropBlock({ files }).run();
          }
          event.currentTarget.value = "";
        }}
      />
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
