"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Sigma } from "lucide-react";

type MathBlockAttrs = {
  expression: string;
};

const DEFAULT_EXPRESSION = "E = mc^2";

function renderMathPreview(expression: string) {
  return expression.trim() || DEFAULT_EXPRESSION;
}

function MathBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as MathBlockAttrs;
  const expression = attrs.expression || "";
  const isEditable = props.editor.isEditable;

  return (
    <NodeViewWrapper className="not-prose my-4" data-testid="math-block">
      <div className="grove-math-block">
        <div className="grove-math-block__preview" aria-label="Math preview">
          <Sigma className="grove-math-block__icon" aria-hidden="true" />
          <code>{renderMathPreview(expression)}</code>
        </div>
        {isEditable ? (
          <textarea
            className="grove-math-block__input"
            value={expression}
            placeholder="LaTeX 수식을 입력하세요"
            rows={2}
            onChange={(event) => {
              props.updateAttributes({ expression: event.target.value });
            }}
          />
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      expression: {
        default: DEFAULT_EXPRESSION,
        parseHTML: (element) => element.getAttribute("data-expression") ?? DEFAULT_EXPRESSION,
        renderHTML: (attributes) => ({
          "data-expression": attributes.expression,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='math-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "math-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },

  addCommands() {
    return {
      insertMathBlock:
        (attrs?: { expression?: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              expression: attrs?.expression ?? DEFAULT_EXPRESSION,
            },
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: (attrs?: { expression?: string }) => ReturnType;
    };
  }
}
