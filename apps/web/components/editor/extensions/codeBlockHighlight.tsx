"use client";

import { Fragment, type ReactNode } from "react";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { sql } from "@codemirror/lang-sql";
import { highlightCode, tagHighlighter, tags } from "@lezer/highlight";
import type { LanguageId } from "./codeBlockLanguages";

type CodeParser = ReturnType<typeof javascript>["language"]["parser"];

const syntaxHighlighter = tagHighlighter([
  { tag: tags.comment, class: "tok-comment" },
  { tag: tags.keyword, class: "tok-keyword" },
  { tag: [tags.string, tags.special(tags.string)], class: "tok-string" },
  { tag: [tags.number, tags.bool, tags.null], class: "tok-number" },
  { tag: [tags.typeName, tags.className, tags.tagName], class: "tok-type" },
  { tag: [tags.variableName, tags.propertyName, tags.attributeName], class: "tok-variable" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], class: "tok-function" },
  { tag: [tags.operator, tags.punctuation, tags.separator], class: "tok-operator" },
  { tag: [tags.meta, tags.escape], class: "tok-meta" },
  { tag: tags.invalid, class: "tok-invalid" },
]);

const parserByLanguage: Partial<Record<LanguageId, CodeParser>> = {
  javascript: javascript().language.parser,
  typescript: javascript({ typescript: true }).language.parser,
  react: javascript({ jsx: true }).language.parser,
  "react-ts": javascript({ jsx: true, typescript: true }).language.parser,
  node: javascript().language.parser,
  nextjs: javascript({ jsx: true, typescript: true }).language.parser,
  "vite-react": javascript({ jsx: true }).language.parser,
  vue: html({ matchClosingTags: false }).language.parser,
  angular: html({ matchClosingTags: false }).language.parser,
  svelte: html({ matchClosingTags: false }).language.parser,
  solid: javascript({ jsx: true }).language.parser,
  astro: html({ matchClosingTags: false }).language.parser,
  html: html({ matchClosingTags: false }).language.parser,
  css: css().language.parser,
  sql: sql().language.parser,
};

type HighlightSegment = {
  text: string;
  className: string;
};

function escapePlainText(code: string) {
  return code.length > 0 ? code : "// 코드가 비어 있습니다";
}

export function renderHighlightedCode(code: string, language: LanguageId): ReactNode {
  const source = escapePlainText(code);
  const parser = parserByLanguage[language];

  if (!parser) {
    return source;
  }

  const tree = parser.parse(source);
  const lines: HighlightSegment[][] = [[]];

  highlightCode(
    source,
    tree,
    syntaxHighlighter,
    (text, className) => {
      const currentLine = lines[lines.length - 1];
      currentLine.push({ text, className });
    },
    () => {
      lines.push([]);
    }
  );

  return lines.map((segments, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {segments.length > 0
        ? segments.map((segment, segmentIndex) => (
            <span
              key={`segment-${lineIndex}-${segmentIndex}`}
              className={segment.className || undefined}
            >
              {segment.text}
            </span>
          ))
        : ""}
      {lineIndex < lines.length - 1 ? "\n" : null}
    </Fragment>
  ));
}
