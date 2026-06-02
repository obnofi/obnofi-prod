"use client";

import { useState, useCallback, useMemo } from "react";
import { Check, Copy, Play, ChevronDown, ChevronRight, X } from "lucide-react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { LANGUAGES, type CodeBlockAttrs, type LanguageId } from "./codeBlockLanguages";
import { CodeBlockSandpackPreview } from "./CodeBlockSandpack";
import { renderHighlightedCode } from "./codeBlockHighlight";

export function CodeBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as CodeBlockAttrs;
  const { language, code, isOpen } = attrs;
  const isEditable = props.editor.isEditable;

  const [copied, setCopied] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [showPreview, setShowPreview] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];
  const isRunnable = currentLang.sandpackTemplate !== null;
  const codeLineCount = useMemo(
    () => Math.max(1, localCode.split("\n").length),
    [localCode]
  );
  const codeEditorRows = Math.min(Math.max(3, codeLineCount), 24);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 복사 실패 시 무시
    }
  }, [localCode]);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      setLocalCode(newCode);
      props.updateAttributes({ code: newCode });
    },
    [props]
  );

  const handleLanguageChange = useCallback(
    (langId: LanguageId) => {
      props.updateAttributes({ language: langId });
      setIsLangDropdownOpen(false);
      setShowPreview(false);
    },
    [props]
  );

  const toggleExpand = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    props.updateAttributes({ isOpen: newState });
  }, [isExpanded, props]);

  const runCode = useCallback(() => {
    if (!isRunnable) return;
    setShowPreview(true);
  }, [isRunnable]);

  return (
    <NodeViewWrapper
      className="my-4"
      data-testid="code-block"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="not-prose overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
          <div className="flex items-center gap-2">
            {/* 토글 버튼 */}
            <button
              type="button"
              onClick={toggleExpand}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className="flex items-center justify-center rounded p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              title={isExpanded ? "접기" : "펼치기"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* 언어 선택 드롭다운 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => isEditable && setIsLangDropdownOpen(!isLangDropdownOpen)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                disabled={!isEditable}
                className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{currentLang.label}</span>
                {isEditable && (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                )}
              </button>

              {isLangDropdownOpen && isEditable && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-48 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                          lang.id === language
                            ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                        }`}
                      >
                        <span>{lang.label}</span>
                        {lang.sandpackTemplate && (
                          <span className="ml-2 text-xs text-[var(--color-accent)]">●</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1">
            {isRunnable && (
              <button
                type="button"
                onClick={() => (showPreview ? setShowPreview(false) : runCode())}
                className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  showPreview
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    : "text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]"
                }`}
                title={showPreview ? "미리보기 닫기" : "코드 실행"}
              >
                {showPreview ? (
                  <>
                    <X className="h-3.5 w-3.5" />
                    <span>닫기</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>실행</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              title="코드 복사"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  <span>복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠: 코드 + 미리보기 (2열 레이아웃) */}
        <div
          className={`grid ${
            showPreview && isRunnable ? "grid-cols-2" : "grid-cols-1"
          } divide-x divide-[var(--color-border)]`}
        >
          {/* 코드 영역 */}
          <div className={`${!isExpanded ? "hidden" : ""}`}>
            {isEditable ? (
              <textarea
                value={localCode}
                onChange={handleCodeChange}
                placeholder="코드를 입력하세요..."
                spellCheck={false}
                className="block max-h-[520px] min-h-[96px] w-full resize-none overflow-y-auto bg-transparent p-4 font-mono text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                style={{
                  fontFamily:
                    '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
                }}
                rows={codeEditorRows}
              />
            ) : (
              <pre
                className="code-block-content max-h-[520px] min-h-[96px] overflow-auto p-4 font-mono text-sm leading-relaxed text-[var(--color-text-primary)]"
                style={{
                  fontFamily:
                    '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
                }}
              >
                <code>{renderHighlightedCode(localCode, language)}</code>
              </pre>
            )}
          </div>

          {/* 접힌 상태 placeholder */}
          {!isExpanded && (
            <div className="flex min-h-[120px] items-center justify-center py-8 text-sm text-[var(--color-text-secondary)]">
              <span>코드가 접혀 있습니다</span>
            </div>
          )}

          {/* Sandpack 미리보기 영역 */}
          {showPreview && isRunnable && currentLang.sandpackTemplate && (
            <CodeBlockSandpackPreview language={language} localCode={localCode} />
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs text-[var(--color-text-secondary)]">
          <span>
            {codeLineCount} 줄
            {localCode.length > 0 && ` · ${localCode.length} 문자`}
            {!isExpanded && " · 접힘"}
            {showPreview && " · 미리보기 실행 중"}
          </span>
          <span className="uppercase tracking-wider">{language}</span>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
