import { type TiptapNode, parseInlineMarkdown } from "./inlineParsers";
import {
  TASK_LIST_PATTERN,
  TASK_LIST_ITEM_PATTERN,
  BULLET_LIST_PATTERN,
  ORDERED_LIST_PATTERN,
  BLOCKQUOTE_PATTERN,
  TOGGLE_SUMMARY_PATTERN,
  TOGGLE_OPEN_SUMMARY_PATTERN,
  HEADING_PATTERN,
  HORIZONTAL_RULE_PATTERN,
  CODE_FENCE_PATTERN,
  CODE_BLOCK_LANGUAGE_ALIASES,
} from "./patterns";

export function createParagraphNode(text: string): TiptapNode {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return { type: "paragraph" };
  }

  return {
    type: "paragraph",
    content: parseInlineMarkdown(normalizedText),
  };
}

export function isBlockBoundary(line: string) {
  return (
    HEADING_PATTERN.test(line) ||
    TASK_LIST_PATTERN.test(line) ||
    BULLET_LIST_PATTERN.test(line) ||
    ORDERED_LIST_PATTERN.test(line) ||
    BLOCKQUOTE_PATTERN.test(line) ||
    TOGGLE_SUMMARY_PATTERN.test(line) ||
    TOGGLE_OPEN_SUMMARY_PATTERN.test(line) ||
    HORIZONTAL_RULE_PATTERN.test(line) ||
    CODE_FENCE_PATTERN.test(line)
  );
}

export function consumeParagraph(lines: string[], startIndex: number) {
  const paragraphLines: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      break;
    }
    if (index !== startIndex && isBlockBoundary(line)) {
      break;
    }
    paragraphLines.push(line.trim());
    index += 1;
  }

  return {
    node: createParagraphNode(paragraphLines.join(" ")),
    nextIndex: index,
  };
}

export function consumeBulletList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(BULLET_LIST_PATTERN);
    if (!match) {
      break;
    }

    items.push({
      type: "listItem",
      content: [createParagraphNode(match[1])],
    });
    index += 1;
  }

  return {
    node: { type: "bulletList", content: items },
    nextIndex: index,
  };
}

export function consumeTaskList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(TASK_LIST_ITEM_PATTERN);
    if (!match) {
      break;
    }

    items.push({
      type: "taskItem",
      attrs: { checked: match[1].toLowerCase() === "x" },
      content: [createParagraphNode(match[2] ?? "")],
    });
    index += 1;
  }

  return {
    node: { type: "taskList", content: items },
    nextIndex: index,
  };
}

export function consumeOrderedList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(ORDERED_LIST_PATTERN);
    if (!match) {
      break;
    }

    items.push({
      type: "listItem",
      content: [createParagraphNode(match[1])],
    });
    index += 1;
  }

  return {
    node: { type: "orderedList", content: items },
    nextIndex: index,
  };
}

export function consumeToggleBlock(lines: string[], startIndex: number) {
  const openingLine = lines[startIndex];
  let summary = "";
  let isOpen = false;

  // Check for open toggle pattern (>> summary)
  const openMatch = openingLine.match(TOGGLE_OPEN_SUMMARY_PATTERN);
  if (openMatch) {
    summary = openMatch[1].trim();
    isOpen = true;
  } else {
    // Check for closed toggle pattern (>! summary)
    const closedMatch = openingLine.match(TOGGLE_SUMMARY_PATTERN);
    if (closedMatch) {
      summary = closedMatch[1].trim();
    }
  }

  let index = startIndex + 1;
  const bodyLines: string[] = [];

  // Collect body lines (indented or consecutive blockquote lines that are not toggle patterns)
  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    // Stop at empty line or new block boundary
    if (trimmedLine === "") {
      break;
    }

    // Stop at another toggle pattern
    if (TOGGLE_SUMMARY_PATTERN.test(line) || TOGGLE_OPEN_SUMMARY_PATTERN.test(line)) {
      break;
    }

    // Stop at other block boundaries
    if (isBlockBoundary(line) && !BLOCKQUOTE_PATTERN.test(line)) {
      break;
    }

    // If it's a regular blockquote line, extract content
    const bqMatch = line.match(BLOCKQUOTE_PATTERN);
    if (bqMatch) {
      bodyLines.push(bqMatch[1]);
    } else if (line.startsWith(" ") || line.startsWith("\t")) {
      // Indented line (remove indentation)
      bodyLines.push(line.replace(/^[\s]+/, ""));
    } else {
      bodyLines.push(line);
    }

    index += 1;
  }

  // Parse body content into paragraphs
  const content: TiptapNode[] = [];
  let currentParagraphLines: string[] = [];

  for (const line of bodyLines) {
    if (line.trim() === "") {
      if (currentParagraphLines.length > 0) {
        content.push(createParagraphNode(currentParagraphLines.join(" ")));
        currentParagraphLines = [];
      }
    } else {
      currentParagraphLines.push(line);
    }
  }

  if (currentParagraphLines.length > 0) {
    content.push(createParagraphNode(currentParagraphLines.join(" ")));
  }

  // Ensure at least one paragraph
  if (content.length === 0) {
    content.push(createParagraphNode(""));
  }

  return {
    node: {
      type: "toggleBlock",
      attrs: { summary, open: isOpen },
      content,
    },
    nextIndex: index,
  };
}

export function consumeBlockquote(lines: string[], startIndex: number) {
  const quotedLines: string[] = [];
  let index = startIndex;

  // Collect all consecutive blockquote lines
  while (index < lines.length) {
    const match = lines[index].match(BLOCKQUOTE_PATTERN);
    if (!match) {
      break;
    }
    quotedLines.push(match[1]);
    index += 1;
  }

  // Split quoted content into paragraphs (separated by empty lines in the quoted content)
  const paragraphs: TiptapNode[] = [];
  let currentParagraphLines: string[] = [];

  for (const line of quotedLines) {
    if (line.trim() === "") {
      // Empty line indicates paragraph break
      if (currentParagraphLines.length > 0) {
        paragraphs.push(createParagraphNode(currentParagraphLines.join(" ")));
        currentParagraphLines = [];
      }
    } else {
      currentParagraphLines.push(line);
    }
  }

  // Don't forget the last paragraph
  if (currentParagraphLines.length > 0) {
    paragraphs.push(createParagraphNode(currentParagraphLines.join(" ")));
  }

  // If no paragraphs were created, create an empty one
  if (paragraphs.length === 0) {
    paragraphs.push(createParagraphNode(""));
  }

  return {
    node: {
      type: "blockquote",
      content: paragraphs,
    },
    nextIndex: index,
  };
}

export function consumeCodeBlock(lines: string[], startIndex: number) {
  const openingLine = lines[startIndex];
  const rawLanguage = openingLine.slice(3).trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const language =
    CODE_BLOCK_LANGUAGE_ALIASES[rawLanguage] ?? rawLanguage ?? "plaintext";
  const codeLines: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length && !lines[index].startsWith("```")) {
    codeLines.push(lines[index]);
    index += 1;
  }

  if (index < lines.length && lines[index].startsWith("```")) {
    index += 1;
  }

  return {
    node: {
      type: "codeBlock",
      attrs: {
        language: language || "plaintext",
        code: codeLines.join("\n"),
        isOpen: true,
      },
    },
    nextIndex: index,
  };
}

export type { TiptapNode };
