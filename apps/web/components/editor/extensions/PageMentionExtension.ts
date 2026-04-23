import { Mark, InputRule, mergeAttributes } from "@tiptap/core";
import { usePageStore } from "@/store/pageStore";

export const PageLinkMark = Mark.create<{ workspaceId?: string }>({
  name: "pageLinkMark",

  addOptions() {
    return { workspaceId: undefined };
  },

  addAttributes() {
    return {
      pageId: { default: null },
      workspaceId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-page-link]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { pageId, workspaceId } = HTMLAttributes;
    return [
      "a",
      mergeAttributes(
        {
          "data-page-link": "true",
          href:
            workspaceId && pageId
              ? `/workspace/${workspaceId}?page=${pageId}`
              : undefined,
          class: "page-link-text",
        },
        HTMLAttributes
      ),
      0,
    ];
  },

  addInputRules() {
    const workspaceId = this.options.workspaceId;

    return [
      new InputRule({
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ state, range, match }) => {
          const name = match[1].trim();
          const { pages } = usePageStore.getState();
          const page = pages.find(
            (p) => p.title.toLowerCase() === name.toLowerCase()
          );

          if (!page) return null;

          const mark = state.schema.marks.pageLinkMark.create({
            pageId: page.id,
            workspaceId: workspaceId ?? null,
          });

          state.tr.addMark(range.from, range.to, mark);
        },
      }),
    ];
  },
});
