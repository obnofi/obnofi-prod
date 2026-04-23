import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import { PersonalEmojiList } from "../PersonalEmojiList";
import type { PersonalEmojiListHandle } from "../PersonalEmojiList";

type EmojiQuery = string;

export function createPersonalEmojiSuggestion() {
  return () => {
    let component: ReactRenderer<PersonalEmojiListHandle> | null = null;
    let popup: TippyInstance | null = null;

    return {
      onStart: (props: SuggestionProps<EmojiQuery>) => {
        component = new ReactRenderer(PersonalEmojiList, {
          props: {
            query: props.items[0] ?? "",
            command: props.command,
            editor: props.editor,
            range: props.range,
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

      onUpdate: (props: SuggestionProps<EmojiQuery>) => {
        component?.updateProps({
          query: props.items[0] ?? "",
          command: props.command,
          editor: props.editor,
          range: props.range,
        });

        const clientRect = props.clientRect?.();
        if (clientRect && popup) {
          popup.setProps({ getReferenceClientRect: () => clientRect });
        }
      },

      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === "Escape") {
          popup?.hide();
          return true;
        }
        return component?.ref?.onKeyDown(props.event) ?? false;
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
