"use client";

import { useState, useCallback } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import {
  Check,
  Copy,
  Play,
  ChevronDown,
  ChevronRight,
  X,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";

// 지원하는 프로그래밍 언어 목록
const LANGUAGES = [
  { id: "javascript", label: "JavaScript", sandpackTemplate: "vanilla" as const },
  { id: "typescript", label: "TypeScript", sandpackTemplate: "vanilla-ts" as const },
  { id: "react", label: "React", sandpackTemplate: "react" as const },
  { id: "react-ts", label: "React TS", sandpackTemplate: "react-ts" as const },
  { id: "vue", label: "Vue", sandpackTemplate: "vue" as const },
  { id: "angular", label: "Angular", sandpackTemplate: "angular" as const },
  { id: "svelte", label: "Svelte", sandpackTemplate: "svelte" as const },
  { id: "solid", label: "Solid", sandpackTemplate: "solid" as const },
  { id: "python", label: "Python", sandpackTemplate: null },
  { id: "node", label: "Node.js", sandpackTemplate: "node" as const },
  { id: "nextjs", label: "Next.js", sandpackTemplate: "nextjs" as const },
  { id: "vite-react", label: "Vite React", sandpackTemplate: "vite-react" as const },
  { id: "vite-vue", label: "Vite Vue", sandpackTemplate: "vite-vue" as const },
  { id: "vite-svelte", label: "Vite Svelte", sandpackTemplate: "vite-svelte" as const },
  { id: "astro", label: "Astro", sandpackTemplate: "astro" as const },
  { id: "rust", label: "Rust", sandpackTemplate: "rust" as const },
  { id: "go", label: "Go", sandpackTemplate: "go" as const },
  { id: "java", label: "Java", sandpackTemplate: null },
  { id: "cpp", label: "C++", sandpackTemplate: null },
  { id: "html", label: "HTML", sandpackTemplate: "static" as const },
  { id: "css", label: "CSS", sandpackTemplate: null },
  { id: "json", label: "JSON", sandpackTemplate: null },
  { id: "markdown", label: "Markdown", sandpackTemplate: null },
  { id: "bash", label: "Bash", sandpackTemplate: null },
  { id: "sql", label: "SQL", sandpackTemplate: null },
  { id: "graphql", label: "GraphQL", sandpackTemplate: null },
  { id: "plaintext", label: "Plain Text", sandpackTemplate: null },
] as const;

type LanguageId = (typeof LANGUAGES)[number]["id"];

interface CodeBlockAttrs {
  language: LanguageId;
  code: string;
  isOpen: boolean;
}

// Sandpack 재실행 버튼 컴포넌트
function SandpackRerunButton() {
  const { sandpack } = useSandpack();

  return (
    <button
      type="button"
      onClick={() => sandpack.runSandpack()}
      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
      title="다시 실행"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      <span>재실행</span>
    </button>
  );
}

function CodeBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as CodeBlockAttrs;
  const { language, code, isOpen } = attrs;
  const isEditable = props.editor.isEditable;

  const [copied, setCopied] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [showPreview, setShowPreview] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];
  const isRunnable = currentLang.sandpackTemplate !== null;

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
      // 언어 변경 시 미리보기 닫기
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

  const closePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  // Sandpack 파일 구성
  const getSandpackFiles = useCallback(() => {
    const template = currentLang.sandpackTemplate;
    if (!template) return {};

    switch (template) {
      case "vanilla":
        return {
          "/index.js": localCode,
          "/index.html": `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Sandpack</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.js"></script>
  </body>
</html>`,
        };
      case "vanilla-ts":
        return {
          "/index.ts": localCode,
          "/index.html": `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Sandpack</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.ts"></script>
  </body>
</html>`,
        };
      case "react":
        return {
          "/App.js": localCode,
        };
      case "react-ts":
        return {
          "/App.tsx": localCode,
        };
      case "static":
        return {
          "/index.html": localCode,
        };
      case "vue":
        return {
          "/src/App.vue": localCode,
        };
      case "svelte":
        return {
          "/App.svelte": localCode,
        };
      case "nextjs":
        return {
          "/pages/index.js": localCode,
        };
      case "node":
        return {
          "/index.js": localCode,
        };
      default:
        return {
          "/index.js": localCode,
        };
    }
  }, [currentLang.sandpackTemplate, localCode]);

  return (
    <NodeViewWrapper className="my-4" data-testid="code-block">
      <div className="not-prose overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
          <div className="flex items-center gap-2">
            {/* 토글 버튼 */}
            <button
              type="button"
              onClick={toggleExpand}
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
            {/* 미리보기 토글 (실행 가능한 경우에만) */}
            {isRunnable && (
              <button
                type="button"
                onClick={() => showPreview ? setShowPreview(false) : runCode()}
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
        <div className={`grid ${showPreview && isRunnable ? "grid-cols-2" : "grid-cols-1"} divide-x divide-[var(--color-border)]`}>
          {/* 코드 영역 */}
          <div className={`${!isExpanded ? "hidden" : ""} min-h-[200px]`}>
            {isEditable ? (
              <textarea
                value={localCode}
                onChange={handleCodeChange}
                placeholder="코드를 입력하세요..."
                spellCheck={false}
                className="h-full min-h-[200px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                style={{
                  fontFamily:
                    '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
                }}
                rows={Math.max(8, localCode.split("\n").length)}
              />
            ) : (
              <pre
                className="h-full min-h-[200px] overflow-x-auto p-4 font-mono text-sm leading-relaxed text-[var(--color-text-primary)]"
                style={{
                  fontFamily:
                    '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
                }}
              >
                <code>{localCode || "// 코드가 비어 있습니다"}</code>
              </pre>
            )}
          </div>

          {/* 접힌 상태에서 코드 영역 placeholder */}
          {!isExpanded && (
            <div className="flex min-h-[120px] items-center justify-center py-8 text-sm text-[var(--color-text-secondary)]">
              <span>코드가 접혀 있습니다</span>
            </div>
          )}

          {/* Sandpack 미리보기 영역 */}
          {showPreview && isRunnable && currentLang.sandpackTemplate && (
            <div className="min-h-[200px] bg-[var(--color-background)]">
              <SandpackProvider
                template={currentLang.sandpackTemplate as never}
                files={getSandpackFiles() as never}
                options={{
                  recompileMode: "delayed",
                  recompileDelay: 500,
                  autorun: true,
                }}
                theme={{
                  colors: {
                    surface1: "var(--color-background)",
                    surface2: "var(--color-surface)",
                    surface3: "var(--color-hover)",
                    clickable: "var(--color-text-secondary)",
                    base: "var(--color-text-primary)",
                    disabled: "var(--color-text-placeholder)",
                    hover: "var(--color-hover)",
                    accent: "var(--color-accent)",
                    error: "#ef4444",
                    errorSurface: "#fef2f2",
                  },
                  syntax: {
                    plain: "var(--color-text-primary)",
                    comment: {
                      color: "var(--color-text-secondary)",
                      fontStyle: "italic",
                    },
                    keyword: "var(--color-accent)",
                    tag: "#2563eb",
                    punctuation: "var(--color-text-secondary)",
                    definition: "var(--color-text-primary)",
                    property: "var(--color-text-primary)",
                    static: "#dc2626",
                    string: "#16a34a",
                  },
                  font: {
                    size: "14px",
                    lineHeight: "1.5",
                  },
                }}
              >
                <div className="flex h-full flex-col">
                  {/* Sandpack 툴바 */}
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      미리보기
                    </span>
                    <SandpackRerunButton />
                  </div>
                  
                  {/* Sandpack 레이아웃 */}
                  <SandpackLayout className="!border-0 !rounded-none">
                    <SandpackPreview
                      className="!h-[250px]"
                      showRefreshButton={false}
                      showOpenInCodeSandbox={false}
                    />
                  </SandpackLayout>
                  
                  {/* 콘솔 출력 */}
                  <div className="flex-1 border-t border-[var(--color-border)]">
                    <SandpackConsole
                      className="!h-[120px]"
                      showHeader={false}
                    />
                  </div>
                </div>
              </SandpackProvider>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs text-[var(--color-text-secondary)]">
          <span>
            {localCode.split("\n").length} 줄
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

export const CodeBlock = Node.create({
  name: "codeBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      language: {
        default: "javascript",
      },
      code: {
        default: "",
      },
      isOpen: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='code-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "code-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addCommands() {
    return {
      insertCodeBlock:
        () =>
        ({ commands }: { commands: { insertContent: (content: unknown) => unknown } }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              language: "javascript",
              code: "",
              isOpen: true,
            },
          }),
    } as never;
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/code$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;

          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: {
                language: "javascript",
                code: "",
                isOpen: true,
              },
            })
            .run();
        },
      }),
    ];
  },
});
