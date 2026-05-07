import { normalizeTiptapDocument } from "@/lib/normalizeTiptapDocument";

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
};

function createTextNode(text: string): TiptapNode {
  return { type: "text", text };
}

function createParagraphNode(text: string): TiptapNode {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return { type: "paragraph" };
  }

  return {
    type: "paragraph",
    content: [createTextNode(normalizedText)],
  };
}

function isBlockBoundary(line: string) {
  return (
    /^#{1,5}\s+/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^```/.test(line)
  );
}

function consumeParagraph(lines: string[], startIndex: number) {
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

function consumeBulletList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(/^\s*[-*+]\s+(.*)$/);
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

function consumeOrderedList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(/^\s*\d+\.\s+(.*)$/);
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

function consumeBlockquote(lines: string[], startIndex: number) {
  const quotedLines: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(/^>\s?(.*)$/);
    if (!match) {
      break;
    }
    quotedLines.push(match[1]);
    index += 1;
  }

  return {
    node: {
      type: "blockquote",
      content: [createParagraphNode(quotedLines.join(" "))],
    },
    nextIndex: index,
  };
}

function consumeCodeBlock(lines: string[], startIndex: number) {
  const openingLine = lines[startIndex];
  const language = openingLine.slice(3).trim();
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
      attrs: { language: language || null },
      content: [createTextNode(codeLines.join("\n"))],
    },
    nextIndex: index,
  };
}

export function markdownToTiptap(markdown: string): object {
  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const lines = normalized.split("\n");
  const content: TiptapNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("```")) {
      const result = consumeCodeBlock(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,5})\s+(.*)$/);
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: [createTextNode(headingMatch[2].trim())],
      });
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const result = consumeBulletList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const result = consumeOrderedList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const result = consumeBlockquote(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    const result = consumeParagraph(lines, index);
    content.push(result.node);
    index = result.nextIndex;
  }

  return normalizeTiptapDocument({
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  });
}
