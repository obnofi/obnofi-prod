import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

export type ActionableBlockInfo = {
  id: string;
  pos: number;
  node: ProseMirrorNode;
  parentNode: ProseMirrorNode;
  parentPos: number;
};

export type BlockPointerCoords = {
  clientX: number;
  clientY: number;
};

export const actionableParentNames = new Set([
  "doc",
  "groveColumn",
  "bulletList",
  "orderedList",
]);

export const actionableNodeNames = [
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "horizontalRule",
  "codeBlock",
  "databaseNode",
  "dbDiagram",
  "canvasEmbed",
  "buttonBlock",
  "linkedDatabaseEmbed",
  "githubEmbedBlock",
  "groveImageBlock",
  "linkEmbedBlock",
  "webClipBlock",
  "fileDropBlock",
  "groveTableBlock",
  "mathBlock",
  "subPageEmbed",
  "columnLayout",
];

export function isActionableBlock(
  node: ProseMirrorNode,
  parent: ProseMirrorNode | null
) {
  return node.isBlock && !!parent && actionableParentNames.has(parent.type.name);
}

export function createBlockId() {
  return `block-${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureBlockIds(doc: ProseMirrorNode, tr: Transaction) {
  const seenBlockIds = new Set<string>();
  let didChange = false;

  doc.descendants((node, pos, parent) => {
    if (!isActionableBlock(node, parent ?? null)) {
      return;
    }

    const blockId = String(node.attrs.blockId ?? "");
    if (!blockId || seenBlockIds.has(blockId)) {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        blockId: createBlockId(),
      });
      didChange = true;
      return;
    }

    seenBlockIds.add(blockId);
  });

  return didChange;
}

export function findBlockById(
  doc: ProseMirrorNode,
  blockId: string
): ActionableBlockInfo | null {
  let match: ActionableBlockInfo | null = null;

  doc.descendants((node, pos, parent) => {
    if (!isActionableBlock(node, parent ?? null)) {
      return;
    }

    if (node.attrs.blockId !== blockId) {
      return;
    }

    const $pos = doc.resolve(pos);

    match = {
      id: blockId,
      pos,
      node,
      parentNode: parent ?? doc,
      parentPos: $pos.depth > 1 ? $pos.before($pos.depth - 1) : 0,
    };

    return false;
  });

  return match;
}

export function cloneJsonWithFreshBlockIds(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonWithFreshBlockIds(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    const nodeType =
      typeof record.type === "string" ? record.type : null;

    for (const [key, entry] of Object.entries(record)) {
      if (
        key === "attrs" &&
        entry &&
        typeof entry === "object" &&
        nodeType &&
        actionableNodeNames.includes(nodeType)
      ) {
        next[key] = {
          ...(entry as Record<string, unknown>),
          blockId: createBlockId(),
        };
        continue;
      }

      next[key] = cloneJsonWithFreshBlockIds(entry);
    }

    if (nodeType && actionableNodeNames.includes(nodeType) && !("attrs" in next)) {
      next.attrs = { blockId: createBlockId() };
    }

    return next;
  }

  return value;
}
