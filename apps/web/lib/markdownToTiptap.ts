import { normalizeTiptapDocument } from "@/lib/normalizeTiptapDocument";
import {
  HEADING_PATTERN,
  HORIZONTAL_RULE_PATTERN,
  CODE_FENCE_PATTERN,
  TASK_LIST_PATTERN,
  BULLET_LIST_PATTERN,
  ORDERED_LIST_PATTERN,
  BLOCKQUOTE_PATTERN,
  TOGGLE_SUMMARY_PATTERN,
  TOGGLE_OPEN_SUMMARY_PATTERN,
  DETAILS_OPEN_PATTERN,
  DETAILS_CLOSE_PATTERN,
  DETAILS_SUMMARY_PATTERN,
} from "./markdown/patterns";
import { parseInlineMarkdown, type TiptapNode } from "./markdown/inlineParsers";
import {
  createParagraphNode,
  consumeCodeBlock,
  consumeTaskList,
  consumeBulletList,
  consumeOrderedList,
  consumeBlockquote,
  consumeToggleBlock,
  consumeParagraph,
} from "./markdown/blockParsers";

const MAX_MARKDOWN_SOURCE_CHARS = 160_000;
const MAX_MARKDOWN_SOURCE_LINES = 4_000;

function clampMarkdownSource(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return normalized;
  }

  const truncatedByChars =
    normalized.length > MAX_MARKDOWN_SOURCE_CHARS
      ? normalized.slice(0, MAX_MARKDOWN_SOURCE_CHARS)
      : normalized;

  const lines = truncatedByChars.split("\n");
  if (lines.length <= MAX_MARKDOWN_SOURCE_LINES) {
    return truncatedByChars;
  }

  return lines.slice(0, MAX_MARKDOWN_SOURCE_LINES).join("\n");
}

function parseMarkdownBlocks(lines: string[]): TiptapNode[] {
  const content: TiptapNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (CODE_FENCE_PATTERN.test(trimmedLine)) {
      const result = consumeCodeBlock(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (HORIZONTAL_RULE_PATTERN.test(trimmedLine)) {
      content.push({ type: "horizontalRule" });
      index += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(HEADING_PATTERN);
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: parseInlineMarkdown(headingMatch[2].trim()),
      });
      index += 1;
      continue;
    }

    if (DETAILS_OPEN_PATTERN.test(trimmedLine)) {
      const openingLine = trimmedLine;
      let nextIndex = index + 1;
      let summary = "";

      if (nextIndex < lines.length) {
        const summaryMatch = lines[nextIndex].trim().match(DETAILS_SUMMARY_PATTERN);
        if (summaryMatch) {
          summary = summaryMatch[1].trim();
          nextIndex += 1;
        }
      }

      const bodyLines: string[] = [];
      let depth = 1;

      while (nextIndex < lines.length) {
        const candidate = lines[nextIndex].trim();

        if (DETAILS_OPEN_PATTERN.test(candidate)) {
          depth += 1;
        } else if (DETAILS_CLOSE_PATTERN.test(candidate)) {
          depth -= 1;
          if (depth === 0) {
            nextIndex += 1;
            break;
          }
        }

        bodyLines.push(lines[nextIndex]);
        nextIndex += 1;
      }

      const bodyContent = parseMarkdownBlocks(bodyLines).filter(
        (node) => node.type !== "paragraph" || Array.isArray(node.content)
      );

      content.push({
        type: "toggleBlock",
        attrs: {
          summary,
          open: /\sopen(?:=|>|\s|$)/i.test(openingLine),
        },
        content: bodyContent.length > 0 ? bodyContent : [createParagraphNode("")],
      });
      index = nextIndex;
      continue;
    }

    // Block parsers are checked in explicit priority order so overlapping regexes stay predictable.
    if (TASK_LIST_PATTERN.test(line)) {
      const result = consumeTaskList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (BULLET_LIST_PATTERN.test(line)) {
      const result = consumeBulletList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (ORDERED_LIST_PATTERN.test(line)) {
      const result = consumeOrderedList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    // Check for toggle blocks first (before regular blockquotes)
    if (TOGGLE_SUMMARY_PATTERN.test(line) || TOGGLE_OPEN_SUMMARY_PATTERN.test(line)) {
      const result = consumeToggleBlock(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (BLOCKQUOTE_PATTERN.test(line)) {
      const result = consumeBlockquote(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    const result = consumeParagraph(lines, index);
    content.push(result.node);
    index = result.nextIndex;
  }

  return content;
}

export function markdownToTiptap(markdown: string): object {
  const normalized = clampMarkdownSource(markdown);
  if (!normalized) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const lines = normalized.split("\n");
  const content = parseMarkdownBlocks(lines);

  return normalizeTiptapDocument({
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  });
}
