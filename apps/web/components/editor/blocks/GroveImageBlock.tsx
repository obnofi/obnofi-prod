"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ImagePlus, Link2 } from "lucide-react";
import { uploadGroveImageAsset } from "@/lib/supabase";

type GroveImageAttrs = {
  src: string;
  alt: string;
  caption: string;
  pageId: string | null;
};

interface GroveImageOptions {
  pageId?: string;
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("이미지 파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

function GroveImageBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as GroveImageAttrs;
  const isEditable = props.editor.isEditable;
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUrl, setPendingUrl] = useState(attrs.src);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setPendingUrl(attrs.src);
  }, [attrs.src]);

  const stopEditorSelection = (event: MouseEvent | ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const commitImageUrl = (rawUrl: string) => {
    const src = rawUrl.trim();
    props.updateAttributes({
      src,
      alt: attrs.alt || attrs.caption || "Grove image",
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    stopEditorSelection(event);
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const src = attrs.pageId
        ? await uploadGroveImageAsset(file, attrs.pageId).catch(() => readImageAsDataUrl(file))
        : await readImageAsDataUrl(file);

      props.updateAttributes({
        src,
        alt: attrs.alt || file.name,
      });
      setPendingUrl(src);
    } catch {
      setUploadError("이미지를 올리지 못했습니다.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      data-testid="grove-image-block"
      contentEditable={false}
      onMouseDown={handleMouseDown}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-image-block">
        {attrs.src ? (
          <div className="grove-image-block__frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attrs.src}
              alt={attrs.alt || attrs.caption || "Grove image"}
              className="grove-image-block__image"
            />
          </div>
        ) : (
          <div className="grove-image-block__empty">
            <ImagePlus className="h-5 w-5" />
            <span>이미지를 추가하세요</span>
          </div>
        )}

        {isEditable ? (
          <div className="grove-image-block__controls" onMouseDown={handleMouseDown}>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />
            <div className="grove-image-block__actions">
              <button
                type="button"
                className="grove-image-block__button"
                onMouseDown={handleMouseDown}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImagePlus className="h-4 w-4" />
                <span>{isUploading ? "업로드 중..." : attrs.src ? "이미지 교체" : "이미지 업로드"}</span>
              </button>
              <label className="grove-image-block__url" htmlFor={`${inputId}-url`}>
                <Link2 className="h-4 w-4" />
                <input
                  id={`${inputId}-url`}
                  type="url"
                  value={pendingUrl}
                  placeholder="https://..."
                  onMouseDown={handleMouseDown}
                  onChange={(event) => {
                    stopEditorSelection(event);
                    setPendingUrl(event.target.value);
                  }}
                  onBlur={() => commitImageUrl(pendingUrl)}
                />
              </label>
            </div>
            <input
              type="text"
              value={attrs.caption}
              placeholder="캡션"
              className="grove-image-block__caption"
              onMouseDown={handleMouseDown}
              onChange={(event) => props.updateAttributes({ caption: event.target.value })}
            />
            {uploadError ? (
              <p className="grove-image-block__error">{uploadError}</p>
            ) : null}
          </div>
        ) : attrs.caption ? (
          <p className="grove-image-block__caption grove-image-block__caption--readonly">
            {attrs.caption}
          </p>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const GroveImageBlock = Node.create<GroveImageOptions>({
  name: "groveImageBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      pageId: undefined,
    };
  },

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      caption: { default: "" },
      pageId: { default: this.options.pageId ?? null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='grove-image-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "grove-image-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GroveImageBlockView);
  },

  addCommands() {
    return {
      insertGroveImageBlock:
        (attrs?: Partial<GroveImageAttrs>) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                src: attrs?.src ?? "",
                alt: attrs?.alt ?? "",
                caption: attrs?.caption ?? "",
                pageId: attrs?.pageId ?? this.options.pageId ?? null,
              },
            },
            { type: "paragraph" },
          ]),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/image$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent([
              {
                type: this.name,
                attrs: {
                  src: "",
                  alt: "",
                  caption: "",
                  pageId: this.options.pageId ?? null,
                },
              },
              { type: "paragraph" },
            ])
            .run();
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    groveImageBlock: {
      insertGroveImageBlock: (attrs?: Partial<GroveImageAttrs>) => ReturnType;
    };
  }
}
