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
        handler: ({ range, match, chain }) => {
          const name = match[1].trim();
          const { pages } = usePageStore.getState();
          const page = pages.find(
            (p) => p.title.toLowerCase() === name.toLowerCase()
          );

          if (!page) return null;

          chain()
            .setTextSelection({ from: range.from, to: range.to })
            .setMark("pageLinkMark", {
              pageId: page.id,
              workspaceId: workspaceId ?? null,
            })
            .run();
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertPageMention:
        ({
          pageId,
          pageTitle,
        }: {
          pageId: string;
          pageTitle: string;
        }) =>
        ({ commands }) =>
          commands.insertContent({
            type: "text",
            text: `[[${pageTitle}]]`,
            marks: [
              {
                type: this.name,
                attrs: {
                  pageId,
                  workspaceId: this.options.workspaceId ?? null,
                },
              },
            ],
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageLinkMark: {
      insertPageMention: (attrs: {
        pageId: string;
        pageTitle: string;
      }) => ReturnType;
    };
  }
}
