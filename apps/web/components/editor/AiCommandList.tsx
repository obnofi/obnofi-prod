"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Pencil,
  AlignLeft,
  Sparkles,
  Minimize2,
  Maximize2,
  Languages,
  HelpCircle,
  Code,
  Loader2,
} from "lucide-react";
import { AiCommandItem } from "@obnofi/types/ai";
import { Editor } from "@tiptap/react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Pencil,
  AlignLeft,
  Sparkles,
  Minimize2,
  Maximize2,
  Languages,
  HelpCircle,
  Code,
};

interface AiCommandListProps {
  items: AiCommandItem[];
  command: (item: AiCommandItem) => void;
  editor: Editor;
  range: { from: number; to: number };
}

export function AiCommandList({
  items,
  command,
  editor,
  range,
}: AiCommandListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    async (index: number) => {
      const item = items[index];
      if (!item || isLoading) return;

      setIsLoading(true);

      try {
        const { state } = editor;
        const { from, to } = range;

        const selectedText = state.doc.textBetween(from, to);
        const contextBefore = state.doc.textBetween(
          Math.max(0, from - 500),
          from
        );

        const prompt = selectedText || contextBefore || "계속 작성해주세요";

        editor.commands.deleteRange({ from, to });

        const insertPos = from;
        let currentPos = insertPos;

        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            context: contextBefore,
            command: item.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        let generatedText = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('0:"')) {
              const textContent = line.slice(3, -1);
              const unescaped = textContent
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");

              generatedText += unescaped;

              editor.commands.insertContentAt(currentPos, unescaped);
              currentPos += unescaped.length;
            }
          }
        }

        editor.commands.setTextSelection({
          from: insertPos + generatedText.length,
          to: insertPos + generatedText.length,
        });

        editor.commands.focus();
      } catch (error) {
        console.error("AI command error:", error);
        editor.commands.insertContentAt(range.from, {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "❌ AI 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    },
    [items, command, editor, range, isLoading]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        selectItem(selectedIndex);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        editor.commands.focus();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, selectItem, editor, isLoading]);

  useEffect(() => {
    const selectedElement = containerRef.current?.children[
      selectedIndex + 1
    ] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="z-[99999] max-h-80 w-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 mb-1">
        AI 명령
      </div>
      {items.map((item, index) => {
        const Icon = iconMap[item.icon];
        const isSelected = index === selectedIndex;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => selectItem(index)}
            disabled={isLoading}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              isSelected
                ? "bg-zinc-100 dark:bg-zinc-800"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              {isSelected && isLoading ? (
                <Loader2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400 animate-spin" />
              ) : Icon ? (
                <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.title}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {item.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
