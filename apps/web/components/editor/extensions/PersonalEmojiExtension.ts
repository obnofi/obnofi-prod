import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { createPersonalEmojiSuggestion } from "./PersonalEmojiSuggestion";

export type PersonalEmojiPayload = {
  id: string;
  name: string;
  src: string;
  alt?: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customEmoji: {
      insertCustomEmoji: (emoji: PersonalEmojiPayload) => ReturnType;
    };
  }
}

export const CustomEmojiNode = Node.create({
  name: "customEmoji",

  group: "inline",

  inline: true,

  atom: true,

  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      name: {
        default: "",
      },
      src: {
        default: "",
      },
      alt: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[data-obnofi-custom-emoji]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes.alt || HTMLAttributes.name || "custom emoji";

    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-obnofi-custom-emoji": "true",
        class: "obnofi-custom-emoji",
        alt: label,
        title: HTMLAttributes.name ? `:${HTMLAttributes.name}:` : label,
        draggable: "false",
      }),
    ];
  },

  addCommands() {
    return {
      insertCustomEmoji:
        (emoji: PersonalEmojiPayload) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: emoji.id,
              name: emoji.name,
              src: emoji.src,
              alt: emoji.alt ?? `:${emoji.name}:`,
            },
          });
        },
    };
  },
});

export const PersonalEmojiExtension = Extension.create({
  name: "personalEmoji",

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("personalEmojiSuggestion"),
        char: ":",
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => [query],
        render: createPersonalEmojiSuggestion(),
      }),
    ];
  },
});
