type JsonRecord = Record<string, unknown>;

const MAX_TOP_LEVEL_BLOCKS = 300;
const MAX_CHILDREN_PER_NODE = 200;
const MAX_TEXT_NODE_CHARS = 4_000;
const MAX_TOTAL_TEXT_CHARS = 120_000;

type NormalizeState = {
  remainingChars: number;
  topLevelBlocks: number;
  wasTruncated: boolean;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampText(text: string, state: NormalizeState) {
  if (state.remainingChars <= 0) {
    state.wasTruncated = true;
    return "";
  }

  const limit = Math.min(MAX_TEXT_NODE_CHARS, state.remainingChars);
  if (text.length > limit) {
    state.wasTruncated = true;
  }

  const nextText = text.slice(0, limit);
  state.remainingChars -= nextText.length;
  return nextText;
}

function normalizeNode(node: unknown, state: NormalizeState, depth: number): JsonRecord | null {
  if (!isRecord(node)) {
    state.wasTruncated = true;
    return null;
  }

  const type = typeof node.type === "string" ? node.type : null;
  if (!type) {
    state.wasTruncated = true;
    return null;
  }

  if (depth === 0) {
    if (state.topLevelBlocks >= MAX_TOP_LEVEL_BLOCKS) {
      state.wasTruncated = true;
      return null;
    }
    state.topLevelBlocks += 1;
  }

  if (type === "text") {
    const rawText = typeof node.text === "string" ? node.text : "";
    const nextText = clampText(rawText, state);
    if (!nextText) {
      return null;
    }

    const normalizedTextNode: JsonRecord = {
      type: "text",
      text: nextText,
    };

    if (isRecord(node.marks)) {
      normalizedTextNode.marks = node.marks;
    } else if (Array.isArray(node.marks)) {
      normalizedTextNode.marks = node.marks;
    }

    return normalizedTextNode;
  }

  const normalizedNode: JsonRecord = { type };

  if (isRecord(node.attrs)) {
    normalizedNode.attrs = node.attrs;
  }

  const rawContent = Array.isArray(node.content) ? node.content : null;
  if (rawContent) {
    const normalizedContent: JsonRecord[] = [];
    for (const child of rawContent.slice(0, MAX_CHILDREN_PER_NODE)) {
      const normalizedChild = normalizeNode(child, state, depth + 1);
      if (normalizedChild) {
        normalizedContent.push(normalizedChild);
      }
      if (state.remainingChars <= 0) {
        break;
      }
    }

    if (rawContent.length > MAX_CHILDREN_PER_NODE) {
      state.wasTruncated = true;
    }

    if (normalizedContent.length > 0) {
      normalizedNode.content = normalizedContent;
    }
  }

  if ("text" in node && typeof node.text === "string") {
    const nextText = clampText(node.text, state);
    if (nextText) {
      normalizedNode.text = nextText;
    }
  }

  return normalizedNode;
}

function createFallbackDocument(message?: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: message
          ? [{ type: "text", text: message }]
          : undefined,
      },
    ],
  };
}

export function normalizeTiptapDocument(content: unknown) {
  if (!isRecord(content) || content.type !== "doc" || !Array.isArray(content.content)) {
    return createFallbackDocument();
  }

  const state: NormalizeState = {
    remainingChars: MAX_TOTAL_TEXT_CHARS,
    topLevelBlocks: 0,
    wasTruncated: false,
  };

  const normalizedContent: JsonRecord[] = [];
  for (const node of content.content) {
    const normalizedNode = normalizeNode(node, state, 0);
    if (normalizedNode) {
      normalizedContent.push(normalizedNode);
    }
    if (state.topLevelBlocks >= MAX_TOP_LEVEL_BLOCKS || state.remainingChars <= 0) {
      break;
    }
  }

  if (normalizedContent.length === 0) {
    return createFallbackDocument();
  }

  if (state.wasTruncated) {
    normalizedContent.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This document was shortened for performance while opening it.",
        },
      ],
    });
  }

  return {
    type: "doc",
    content: normalizedContent,
  };
}
