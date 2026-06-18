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
  onInsertPageLink?: () => void,
  onInsertPageMention?: () => void,
  onSlashCommandChange?: (query: string | null) => void
) {
  return () => {
    let component: ReactRenderer | null = null;
    let popup: TippyInstance | null = null;

    return {
      onStart: (props: SuggestionProps<SlashCommandItem>) => {
        onSlashCommandChange?.("");
        component = new ReactRenderer(SlashCommandList, {
          props: {
            items: props.items,
            command: props.command,
            editor: props.editor,
            range: props.range,
            query: props.query,
            workspaceId,
            pageId,
            onLinkDatabase,
            onInsertButton,
            onInsertPageLink,
            onInsertPageMention,
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
          zIndex: 100010,
          placement: "bottom-start",
          offset: [0, 8],
          maxWidth: "none",
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
        onSlashCommandChange?.(props.query);
        component?.updateProps({
          items: props.items,
          command: props.command,
          editor: props.editor,
          range: props.range,
          query: props.query,
          workspaceId,
          pageId,
          onLinkDatabase,
          onInsertButton,
          onInsertPageLink,
          onInsertPageMention,
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
        onSlashCommandChange?.(null);
        popup?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  };
}
