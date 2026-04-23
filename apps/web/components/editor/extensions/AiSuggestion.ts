import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { AiCommandList } from "../AiCommandList";
import { getAiCommandItems } from "./AiExtension";
import { AiCommandItem } from "@obnofi/types/ai";
import { Editor } from "@tiptap/core";

interface SuggestionProps {
  query: string;
  editor: Editor;
  range: { from: number; to: number };
  items: AiCommandItem[];
  command: (item: AiCommandItem) => void;
  decorationNode?: HTMLElement;
  clientRect?: (() => DOMRect | null) | null;
}

export const aiSuggestion = {
  items: ({ query }: { query: string }) => getAiCommandItems(query),

  render: () => {
    let component: ReactRenderer | null = null;
    let popup: TippyInstance | null = null;

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(AiCommandList, {
          props: {
            items: props.items,
            command: props.command,
            editor: props.editor,
            range: props.range,
          },
          editor: props.editor,
        });

        const clientRect = props.clientRect?.();
        if (!clientRect) return {};

        const instances = tippy(document.body, {
          getReferenceClientRect: () => clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          offset: [0, 8],
          popperOptions: {
            modifiers: [
              {
                name: "preventOverflow",
                options: {
                  boundary: "viewport",
                  padding: 16,
                },
              },
            ],
          },
        });
        popup = Array.isArray(instances) ? instances[0] : instances;
      },

      onUpdate: (props: SuggestionProps) => {
        component?.updateProps({
          items: props.items,
          command: props.command,
          editor: props.editor,
          range: props.range,
        });

        const clientRect = props.clientRect?.();
        if (clientRect && popup) {
          popup.setProps({
            getReferenceClientRect: () => clientRect,
          });
        }
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === "Escape") {
          popup?.hide();
          return true;
        }
        return false;
      },

      onExit: () => {
        popup?.destroy();
        component?.destroy();
      },
    };
  },
};
