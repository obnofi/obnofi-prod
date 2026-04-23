import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import {
  type SuggestionProps,
  type SuggestionKeyDownProps,
} from "@tiptap/suggestion";
import { SlashCommandList } from "../SlashCommandList";
import type { SlashCommandItem } from "./SlashCommandExtension";

export function createSlashSuggestion(
  workspaceId?: string,
  pageId?: string,
  onLinkDatabase?: () => void,
  onInsertButton?: () => void,
  onInsertPageLink?: () => void
) {
  return () => {
    let component: ReactRenderer | null = null;
    let popup: TippyInstance | null = null;

    return {
      onStart: (props: SuggestionProps<SlashCommandItem>) => {
        component = new ReactRenderer(SlashCommandList, {
          props: {
            items: props.items,
            command: props.command,
            editor: props.editor,
            range: props.range,
            workspaceId,
            pageId,
            onLinkDatabase,
            onInsertButton,
            onInsertPageLink,
          },
          editor: props.editor,
        });

        const clientRect = props.clientRect?.();
        if (!clientRect) return;

        const instances = tippy(document.body, {
          getReferenceClientRect: () => clientRect,
          appendTo: () => document.body,
          content: component.element,
          theme: "slash-command",
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          offset: [0, 8],
          popperOptions: {
            modifiers: [
              {
                name: "preventOverflow",
                options: { boundary: "viewport", padding: 16 },
              },
            ],
          },
        });
        popup = Array.isArray(instances) ? instances[0] : instances;
      },

      onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
        component?.updateProps({
          items: props.items,
          command: props.command,
          editor: props.editor,
          range: props.range,
          workspaceId,
          pageId,
          onLinkDatabase,
          onInsertButton,
          onInsertPageLink,
        });

        const clientRect = props.clientRect?.();
        if (clientRect && popup) {
          popup.setProps({ getReferenceClientRect: () => clientRect });
        }

        if (props.items.length === 0) {
          popup?.hide();
        } else {
          popup?.show();
        }
      },

      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === "Escape") {
          popup?.hide();
          return true;
        }
        return false;
      },

      onExit: () => {
        popup?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  };
}
