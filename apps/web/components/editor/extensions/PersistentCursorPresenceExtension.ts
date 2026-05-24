import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  absolutePositionToRelativePosition,
  ySyncPluginKey,
} from "@tiptap/y-tiptap";
import type { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

const pluginKey = new PluginKey("persistentCursorPresence");

interface AwarenessCursorState {
  anchor?: unknown;
  head?: unknown;
}

export interface PersistentCursorPresenceOptions {
  awareness: Awareness | null;
}

function syncLocalCursor(view: import("@tiptap/pm/view").EditorView, awareness: Awareness) {
  const ystate = ySyncPluginKey.getState(view.state);
  if (!ystate?.type || !ystate.binding?.mapping) {
    return;
  }

  const selection = view.state.selection;
  const anchor = absolutePositionToRelativePosition(
    selection.anchor,
    ystate.type,
    ystate.binding.mapping
  );
  const head = absolutePositionToRelativePosition(
    selection.head,
    ystate.type,
    ystate.binding.mapping
  );
  const currentState =
    (awareness.getLocalState() as { cursor?: AwarenessCursorState | null } | null) ?? null;
  const currentCursor = currentState?.cursor;

  if (
    currentCursor &&
    Y.compareRelativePositions(
      Y.createRelativePositionFromJSON(currentCursor.anchor),
      anchor
    ) &&
    Y.compareRelativePositions(
      Y.createRelativePositionFromJSON(currentCursor.head),
      head
    )
  ) {
    return;
  }

  awareness.setLocalStateField("cursor", {
    anchor,
    head,
  });
}

export const PersistentCursorPresenceExtension =
  Extension.create<PersistentCursorPresenceOptions>({
    name: "persistentCursorPresence",

    addOptions() {
      return {
        awareness: null,
      };
    },

    addProseMirrorPlugins() {
      const { awareness } = this.options;
      if (!awareness) return [];

      return [
        new Plugin({
          key: pluginKey,
          view: (view) => {
            const restoreCursorAfterBlur = () => {
              queueMicrotask(() => {
                syncLocalCursor(view, awareness);
              });
            };

            view.dom.addEventListener("focusout", restoreCursorAfterBlur);

            return {
              destroy() {
                view.dom.removeEventListener("focusout", restoreCursorAfterBlur);
              },
            };
          },
        }),
      ];
    },
  });
