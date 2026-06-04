"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isTextUIPart, isToolUIPart } from "ai";
import type { Editor } from "@tiptap/react";
import { KeyRound, Send, X } from "lucide-react";

const LS_KEY = "owl_openai_api_key";

interface OwlChatPanelProps {
  editor?: Editor | null;
  onClose: () => void;
}

const TOOL_STATUS_LABEL: Record<string, string> = {
  getCurrentDate: "📅 날짜 확인 중...",
  getPageContext: "📄 페이지 내용 불러오는 중...",
  insertContent: "✏️ 내용 준비 중...",
};

function ApiKeyScreen({ onSave }: { onSave: (key: string) => void }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed.startsWith("sk-")) return;
    localStorage.setItem(LS_KEY, trimmed);
    onSave(trimmed);
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          OpenAI API 키 입력
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          키는 브라우저 localStorage에만 저장됩니다. 서버로 전송되어 OpenAI 호출에만 사용됩니다.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-..."
          autoFocus
          className="w-full rounded-xl bg-[var(--color-hover)] px-3 py-2 text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
        />
        <button
          type="submit"
          disabled={!value.trim().startsWith("sk-")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        >
          <KeyRound className="h-3.5 w-3.5" />
          저장하고 시작
        </button>
      </form>
    </div>
  );
}

export function OwlChatPanel({ editor, onClose }: OwlChatPanelProps) {
  const editorRef = useRef(editor);
  editorRef.current = editor;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setApiKey(stored);
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/owl" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading || !apiKey) return;
    setInput("");
    await sendMessage(
      { text },
      {
        body: {
          pageContent: editorRef.current?.getText() ?? "",
          apiKey,
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (typeof window === "undefined") return null;

  const panel = (
    <div className="fixed bottom-28 right-6 z-50 flex w-[360px] flex-col rounded-2xl bg-[var(--color-surface)] shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Owl AI
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">· Tool Use</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* API key screen */}
      {!apiKey ? (
        <ApiKeyScreen onSave={setApiKey} />
      ) : (
        <>
          {/* Messages */}
          <div className="flex max-h-[380px] min-h-[120px] flex-col gap-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  무엇을 도와드릴까요?
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  글 작성, 번역, 요약 등을 요청해보세요.
                  <br />
                  AI가 도구를 사용해 더 정확하게 답합니다.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {msg.parts.map((part, i) => {
                  if (isTextUIPart(part)) {
                    return (
                      <div key={i} className="flex w-full flex-col gap-1">
                        <div
                          className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "self-end bg-[var(--color-accent)] text-white"
                              : "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                          }`}
                        >
                          {part.text}
                        </div>
                        {msg.role === "assistant" && part.text && (
                          <button
                            type="button"
                            onClick={() =>
                              editorRef.current
                                ?.chain()
                                .focus()
                                .insertContent(part.text)
                                .run()
                            }
                            className="self-start text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-accent)]"
                          >
                            에디터에 삽입 →
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (isToolUIPart(part)) {
                    const name = getToolName(part);
                    const state = (part as { state: string }).state;
                    const toolInput = (part as { input?: Record<string, string> }).input;
                    const toolOutput = (part as { output?: Record<string, string> }).output;

                    if (name === "insertContent") {
                      const content =
                        state === "output-available"
                          ? toolOutput?.content
                          : toolInput?.content;
                      const summary =
                        state === "output-available"
                          ? toolOutput?.summary
                          : toolInput?.summary;

                      if (
                        (state === "output-available" || state === "input-available") &&
                        content
                      ) {
                        return (
                          <div
                            key={i}
                            className="w-full rounded-xl bg-[var(--color-hover)] p-3"
                          >
                            {summary && (
                              <p className="mb-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                                {summary}
                              </p>
                            )}
                            <pre className="line-clamp-5 whitespace-pre-wrap font-mono text-xs text-[var(--color-text-primary)]">
                              {content}
                            </pre>
                            <button
                              type="button"
                              onClick={() =>
                                editorRef.current
                                  ?.chain()
                                  .focus()
                                  .insertContent(content)
                                  .run()
                              }
                              className="mt-2 text-xs font-medium text-[var(--color-accent)] hover:underline"
                            >
                              → 에디터에 삽입
                            </button>
                          </div>
                        );
                      }
                    }

                    if (state === "input-streaming" || state === "input-available") {
                      return (
                        <p
                          key={i}
                          className="text-xs italic text-[var(--color-text-muted)]"
                        >
                          {TOOL_STATUS_LABEL[name] ?? `🔧 ${name} 실행 중...`}
                        </p>
                      );
                    }

                    return null;
                  }

                  return null;
                })}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-xl bg-[var(--color-hover)] px-3 py-2 text-sm">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-muted)]"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                autoFocus
                className="flex-1 rounded-xl bg-[var(--color-hover)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );

  return createPortal(panel, document.body);
}
