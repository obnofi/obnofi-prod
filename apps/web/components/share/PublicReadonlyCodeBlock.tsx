"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { LANGUAGES, type CodeBlockAttrs } from "@/components/editor/extensions/codeBlockLanguages";
import { renderHighlightedCode } from "@/components/editor/extensions/codeBlockHighlight";

export function PublicReadonlyCodeBlock(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as CodeBlockAttrs;
  const currentLang = LANGUAGES.find((language) => language.id === attrs.language) ?? LANGUAGES[0];
  const lineCount = Math.max(1, attrs.code.split("\n").length);

  return (
    <NodeViewWrapper className="my-4" data-testid="public-code-block" contentEditable={false}>
      <div className="not-prose overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
          <span className="rounded px-2 py-1 text-sm font-medium text-[var(--color-text-primary)]">
            {currentLang.label}
          </span>
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            {attrs.language}
          </span>
        </div>

        <pre
          className="code-block-content max-h-[520px] min-h-[96px] overflow-auto p-4 text-sm leading-relaxed text-[var(--color-text-primary)]"
          style={{
            fontFamily:
              '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
          }}
        >
          <code>{renderHighlightedCode(attrs.code, attrs.language)}</code>
        </pre>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs text-[var(--color-text-secondary)]">
          <span>
            {lineCount} 줄
            {attrs.code.length > 0 && ` · ${attrs.code.length} 문자`}
          </span>
          <span className="uppercase tracking-wider">{attrs.language}</span>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
