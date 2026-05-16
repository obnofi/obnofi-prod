"use client";

import { useMemo, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, FileText, GitGraph, Globe, Table2 } from "lucide-react";

type GroveTableAttrs = {
  cells: string[][];
};

type FileDropAttrs = {
  files: Array<{ name: string; size: number; type: string }>;
};

type LinkEmbedAttrs = {
  url: string;
};

type GitHubEmbedKind = "repository" | "issue" | "pull" | "gist" | "file" | "unknown";

type GitHubEmbedAttrs = {
  url: string;
  kind: GitHubEmbedKind;
  owner: string;
  repo: string;
  number: string;
  gistId: string;
  title: string;
};

type WebClipAttrs = {
  url: string;
  note: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeGitHubUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parseGitHubEmbedUrl(value: string): GitHubEmbedAttrs | null {
  const normalized = normalizeGitHubUrl(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (host === "gist.github.com") {
      const owner = parts.length > 1 ? parts[0] : "";
      const gistId = parts.length > 1 ? parts[1] : parts[0] ?? "";
      if (!gistId) return null;

      return {
        url: parsed.toString(),
        kind: "gist",
        owner,
        repo: "",
        number: "",
        gistId,
        title: owner ? `${owner} / ${gistId}` : gistId,
      };
    }

    if (host !== "github.com" && host !== "www.github.com") {
      return null;
    }

    const [owner = "", repo = "", section = "", number = ""] = parts;
    if (!owner || !repo) return null;

    if (section === "issues" && number) {
      return {
        url: parsed.toString(),
        kind: "issue",
        owner,
        repo,
        number,
        gistId: "",
        title: `${owner}/${repo}#${number}`,
      };
    }

    if (section === "pull" && number) {
      return {
        url: parsed.toString(),
        kind: "pull",
        owner,
        repo,
        number,
        gistId: "",
        title: `${owner}/${repo}#${number}`,
      };
    }

    return {
      url: parsed.toString(),
      kind: section === "blob" || section === "tree" ? "file" : "repository",
      owner,
      repo,
      number: "",
      gistId: "",
      title: `${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

function getGitHubEmbedLabel(attrs: GitHubEmbedAttrs) {
  if (attrs.kind === "issue") return `Issue #${attrs.number}`;
  if (attrs.kind === "pull") return `Pull request #${attrs.number}`;
  if (attrs.kind === "gist") return "Gist";
  if (attrs.kind === "file") return "Repository path";
  if (attrs.kind === "repository") return "Repository";
  return "GitHub";
}

function getGitHubEmbedMeta(attrs: GitHubEmbedAttrs) {
  if (attrs.kind === "gist") {
    return attrs.owner ? `gist.github.com/${attrs.owner}` : "gist.github.com";
  }

  const target = [attrs.owner, attrs.repo].filter(Boolean).join("/");
  const label = getGitHubEmbedLabel(attrs);
  return target && label !== "GitHub" ? `${target} · ${label}` : target || "github.com";
}

function GroveTableBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as GroveTableAttrs;
  const cells = attrs.cells?.length ? attrs.cells : createDefaultTableCells();

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-insert-block">
        <div className="grove-insert-block__header">
          <Table2 className="h-4 w-4" />
        </div>
        <div className="grove-table-block">
          {cells.map((row, rowIndex) => (
            <div className="grove-table-block__row" key={`row-${rowIndex}`}>
              {row.map((cell, columnIndex) => (
                <input
                  key={`${rowIndex}-${columnIndex}`}
                  className="grove-table-block__cell"
                  value={cell}
                  readOnly={!props.editor.isEditable}
                  onMouseDown={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const nextCells = cells.map((currentRow) => [...currentRow]);
                    nextCells[rowIndex][columnIndex] = event.target.value;
                    props.updateAttributes({ cells: nextCells });
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

function FileDropBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as FileDropAttrs;
  const files = attrs.files ?? [];

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-insert-block">
        <div className="grove-insert-block__header">
          <FileText className="h-4 w-4" />
        </div>
        {files.length ? (
          <div className="grove-file-list">
            {files.map((file, index) => (
              <div className="grove-file-list__item" key={`${file.name}-${index}`}>
                <span className="truncate">{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

function LinkEmbedBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as LinkEmbedAttrs;
  const url = attrs.url;

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <a className="grove-link-embed" href={url} target="_blank" rel="noreferrer">
        <Globe className="h-4 w-4" />
        <span className="min-w-0 flex-1 truncate">{url}</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </NodeViewWrapper>
  );
}

function GitHubEmbedBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as GitHubEmbedAttrs;
  const [draftUrl, setDraftUrl] = useState(attrs.url ?? "");
  const parsedDraft = useMemo(() => parseGitHubEmbedUrl(draftUrl), [draftUrl]);
  const hasUrl = Boolean(attrs.url);
  const isEditable = props.editor.isEditable;
  const meta = getGitHubEmbedMeta(attrs);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsedDraft) return;
    props.updateAttributes(parsedDraft);
  };

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-github-embed" data-testid="github-embed-block">
        {hasUrl ? (
          <a
            className="grove-github-embed__card"
            href={attrs.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="grove-github-embed__icon">
              <GitGraph className="h-4 w-4" />
            </span>
            <span className="grove-github-embed__body">
              <span className="grove-github-embed__title">{attrs.title || attrs.url}</span>
              <span className="grove-github-embed__meta">{meta}</span>
            </span>
            <ExternalLink className="grove-github-embed__open h-3.5 w-3.5" />
          </a>
        ) : isEditable ? (
          <form className="grove-github-embed__form" onSubmit={handleSubmit}>
            <span className="grove-github-embed__icon" aria-hidden="true">
              <GitGraph className="h-4 w-4" />
            </span>
            <input
              aria-label="GitHub URL"
              className="grove-github-embed__input"
              placeholder="GitHub 링크 붙여넣기"
              value={draftUrl}
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => setDraftUrl(event.target.value)}
            />
            <button
              className="grove-github-embed__button"
              type="submit"
              disabled={!parsedDraft}
            >
              임베드
            </button>
          </form>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

function WebClipBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as WebClipAttrs;

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-insert-block">
        <div className="grove-insert-block__header">
          <Globe className="h-4 w-4" />
        </div>
        <a className="grove-web-clip__url" href={attrs.url} target="_blank" rel="noreferrer">
          {attrs.url}
        </a>
        <textarea
          className="grove-web-clip__note"
          value={attrs.note}
          readOnly={!props.editor.isEditable}
          rows={3}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => props.updateAttributes({ note: event.target.value })}
        />
      </div>
    </NodeViewWrapper>
  );
}

function createDefaultTableCells() {
  return [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
}

export const GroveTableBlock = Node.create({
  name: "groveTableBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      cells: { default: createDefaultTableCells() },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='grove-table-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "grove-table-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GroveTableBlockView);
  },

  addCommands() {
    return {
      insertGroveTableBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { cells: createDefaultTableCells() },
          }),
    };
  },
});

export const FileDropBlock = Node.create({
  name: "fileDropBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      files: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='file-drop-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "file-drop-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileDropBlockView);
  },

  addCommands() {
    return {
      insertFileDropBlock:
        (attrs?: FileDropAttrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { files: attrs?.files ?? [] },
          }),
    };
  },
});

export const LinkEmbedBlock = Node.create({
  name: "linkEmbedBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "a[data-type='link-embed-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, { "data-type": "link-embed-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkEmbedBlockView);
  },

  addCommands() {
    return {
      insertLinkEmbedBlock:
        (attrs: LinkEmbedAttrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});

export const GitHubEmbedBlock = Node.create({
  name: "githubEmbedBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      kind: { default: "unknown" },
      owner: { default: "" },
      repo: { default: "" },
      number: { default: "" },
      gistId: { default: "" },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='github-embed-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "github-embed-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GitHubEmbedBlockView);
  },

  addCommands() {
    return {
      insertGitHubEmbedBlock:
        (attrs?: Partial<GitHubEmbedAttrs>) =>
        ({ commands }) => {
          const parsedAttrs = attrs?.url ? parseGitHubEmbedUrl(attrs.url) : null;

          return commands.insertContent({
            type: this.name,
            attrs: parsedAttrs ?? attrs ?? {},
          });
        },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/(?:github|gist|pr)$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: {},
            })
            .run();
        },
      }),
    ];
  },
});

export const WebClipBlock = Node.create({
  name: "webClipBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      note: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='web-clip-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "web-clip-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WebClipBlockView);
  },

  addCommands() {
    return {
      insertWebClipBlock:
        (attrs: WebClipAttrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    groveTableBlock: {
      insertGroveTableBlock: () => ReturnType;
    };
    fileDropBlock: {
      insertFileDropBlock: (attrs?: FileDropAttrs) => ReturnType;
    };
    linkEmbedBlock: {
      insertLinkEmbedBlock: (attrs: LinkEmbedAttrs) => ReturnType;
    };
    githubEmbedBlock: {
      insertGitHubEmbedBlock: (attrs?: Partial<GitHubEmbedAttrs>) => ReturnType;
    };
    webClipBlock: {
      insertWebClipBlock: (attrs: WebClipAttrs) => ReturnType;
    };
  }
}
