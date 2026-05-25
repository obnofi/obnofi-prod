import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import type { Awareness } from "y-protocols/awareness";
import {
  getJungleCursorAssetPath,
  getJungleCursorRenderMetrics,
} from "@/lib/cursor/jungleCursor";

export interface GroveCollaborationCursorOptions {
  awareness: Awareness;
  user: {
    name: string;
    color: string;
    image?: string | null;
    cursorColorKey?: "green" | "leafy" | "blue" | "pink";
    cursorVariant?: "pointing" | "highlighting" | "fucku";
  };
}

// CollaborationCursor replacement that uses @tiptap/y-tiptap's yCursorPlugin.
// @tiptap/extension-collaboration-cursor uses the y-prosemirror plugin key,
// which is a different object from @tiptap/y-tiptap's key, causing a crash on init.
export const GroveCollaborationCursor =
  Extension.create<GroveCollaborationCursorOptions>({
    name: "groveCollaborationCursor",

    addOptions() {
      return {
        awareness: undefined as unknown as Awareness,
        user: { name: "Anonymous", color: "#958DF1", image: null },
      };
    },

    addProseMirrorPlugins() {
      const { awareness, user } = this.options;
      return [
        yCursorPlugin(awareness, {
          cursorBuilder: (cursorUser: {
            name?: string;
            color?: string;
            image?: string | null;
            cursorColorKey?: "green" | "leafy" | "blue" | "pink";
            cursorVariant?: "pointing" | "highlighting" | "fucku";
          }) => {
            const name = cursorUser?.name ?? user.name;
            const color = cursorUser?.color ?? user.color;
            const cursorColorKey = cursorUser?.cursorColorKey ?? user.cursorColorKey ?? "green";
            const cursorVariant = cursorUser?.cursorVariant ?? user.cursorVariant ?? "pointing";
            const metrics = getJungleCursorRenderMetrics(cursorVariant);

            const caret = document.createElement("span");
            caret.classList.add("collaboration-cursor__caret");
            caret.setAttribute("style", `border-color: ${color}`);

            const badge = document.createElement("div");
            badge.classList.add("collaboration-cursor__badge");
            badge.setAttribute("style", `--cursor-color: ${color}`);
            badge.setAttribute("title", name);

            const label = document.createElement("div");
            label.classList.add("collaboration-cursor__label");
            label.textContent = name;

            const cursorIcon = document.createElement("img");
            cursorIcon.classList.add("collaboration-cursor__icon");
            cursorIcon.setAttribute(
              "src",
              getJungleCursorAssetPath(cursorVariant, cursorColorKey)
            );
            cursorIcon.setAttribute("alt", "");
            cursorIcon.setAttribute("aria-hidden", "true");
            cursorIcon.style.width = `${metrics.width}px`;
            cursorIcon.style.height = `${metrics.height}px`;

            badge.appendChild(cursorIcon);
            badge.appendChild(label);
            caret.appendChild(badge);
            return caret;
          },
        }),
      ];
    },
  });
