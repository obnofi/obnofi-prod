export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

export function createTextNode(text: string): TiptapNode {
  return { type: "text", text };
}

export function appendMark(
  nodes: TiptapNode[],
  mark: { type: string; attrs?: Record<string, unknown> }
) {
  return nodes.map((node) =>
    node.type === "text"
      ? { ...node, marks: [...(node.marks ?? []), mark] }
      : node
  );
}

function findNextInlineMatch(text: string) {
  const patterns = [
    { type: "link", regex: /\[([^\]]*)\]\(([^)]+)\)/ },
    { type: "image", regex: /!\[([^\]]*)\]\(([^)]+)\)/ },
    { type: "code", regex: /`([^`\n]+)`/ },
    { type: "bold", regex: /\*\*([^*\n]+)\*\*|__([^_\n]+)__/ },
    { type: "strike", regex: /~~([^~\n]+)~~/ },
    { type: "italic", regex: /\*([^*\n]+)\*|_([^_\n]+)_/ },
  ] as const;

  let bestMatch:
    | {
        type: (typeof patterns)[number]["type"];
        match: RegExpMatchArray;
      }
    | null = null;

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match || typeof match.index !== "number") {
      continue;
    }

    if (!bestMatch || match.index < (bestMatch.match.index ?? Number.MAX_SAFE_INTEGER)) {
      bestMatch = { type: pattern.type, match };
    }
  }

  return bestMatch;
}

export function parseInlineMarkdown(text: string): TiptapNode[] {
  if (!text) {
    return [];
  }

  const nextMatch = findNextInlineMatch(text);
  if (!nextMatch) {
    return [createTextNode(text)];
  }

  const startIndex = nextMatch.match.index ?? 0;
  const fullMatch = nextMatch.match[0];
  const innerText = nextMatch.match[1] ?? nextMatch.match[2] ?? "";
  const nodes: TiptapNode[] = [];

  if (startIndex > 0) {
    nodes.push(createTextNode(text.slice(0, startIndex)));
  }

  if (nextMatch.type === "link") {
    const linkText = nextMatch.match[1] ?? "";
    const linkUrl = nextMatch.match[2] ?? "";
    nodes.push({
      type: "text",
      text: linkText || linkUrl,
      marks: [{ type: "link", attrs: { href: linkUrl } }],
    });
  } else if (nextMatch.type === "image") {
    const altText = nextMatch.match[1] ?? "";
    const imageUrl = nextMatch.match[2] ?? "";
    nodes.push({
      type: "image",
      attrs: { src: imageUrl, alt: altText },
    });
  } else if (innerText) {
    const inlineNodes = parseInlineMarkdown(innerText);
    const markType =
      nextMatch.type === "code"
        ? "code"
        : nextMatch.type === "bold"
          ? "bold"
          : nextMatch.type === "strike"
            ? "strike"
            : "italic";

    nodes.push(...appendMark(inlineNodes, { type: markType }));
  } else {
    nodes.push(createTextNode(fullMatch));
  }

  const remainingText = text.slice(startIndex + fullMatch.length);
  if (remainingText) {
    nodes.push(...parseInlineMarkdown(remainingText));
  }

  return nodes;
}
