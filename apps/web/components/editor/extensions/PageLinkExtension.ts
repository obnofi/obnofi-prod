import { Node, mergeAttributes } from "@tiptap/core";
import { usePageStore } from "@/store/pageStore";
import type { Page } from "@obnofi/types";

export interface PageLinkOptions {
  HTMLAttributes: Record<string, any>;
}

export interface PageLinkAttributes {
  pageId: string;
  pageTitle: string;
  workspaceId?: string;
}

function createTypeIcon(type: Page["type"] = "document") {
  const icon = document.createElement("span");
  icon.className = "page-link__icon";

  if (type === "canvas") {
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 22a10 10 0 1 1 10-10c0 1.66-1.34 3-3 3h-2.5a2 2 0 0 0-1.56 3.25A2.2 2.2 0 0 1 12 22Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`;
    return icon;
  }

  if (type === "database") {
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
    return icon;
  }

  icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M14 2v4a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M10 9H8M16 13H8M16 17H8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`;
  return icon;
}

function createPageIcon(page: Page | null) {
  if (page?.icon) {
    const icon = document.createElement("span");
    icon.className = "page-link__icon";
    icon.textContent = page.icon;
    return icon;
  }

  return createTypeIcon(page?.type);
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageLink: {
      insertPageLink: (attrs: PageLinkAttributes) => ReturnType;
    };
  }
}

export const PageLinkExtension = Node.create<PageLinkOptions>({
  name: "pageLink",

  group: "block",

  selectable: true,

  atom: true,

  addAttributes() {
    return {
      pageId: {
        default: null,
      },
      pageTitle: {
        default: "",
      },
      workspaceId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="page-link"]',
        getAttrs: (element) => {
          if (typeof element === "string") return null;
          const el = element as HTMLElement;
          return {
            pageId: el.getAttribute("data-page-id"),
            pageTitle: el.getAttribute("data-page-title"),
            workspaceId: el.getAttribute("data-workspace-id"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { pageId, pageTitle, workspaceId } = HTMLAttributes;
    return [
      "a",
      mergeAttributes(
        {
          "data-type": "page-link",
          "data-page-id": pageId,
          "data-page-title": pageTitle,
          "data-workspace-id": workspaceId,
          href: `/workspace/${workspaceId}?page=${pageId}`,
          class: "page-link",
        },
        this.options.HTMLAttributes
      ),
      pageTitle || "Untitled",
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const { pageId, pageTitle, workspaceId } = node.attrs;

      const dom = document.createElement("a");
      const getLinkedPage = () => {
        const state = usePageStore.getState();
        return (
          state.pages.find((page) => page.id === pageId) ??
          (state.currentPage?.id === pageId ? state.currentPage : null) ??
          null
        );
      };
      const getCurrentPageTitle = () => {
        const linkedPage = getLinkedPage();

        return linkedPage?.title || pageTitle || "Untitled";
      };
      const updateLabel = () => {
        const nextTitle = getCurrentPageTitle();
        const linkedPage = getLinkedPage();
        dom.setAttribute("data-page-title", nextTitle);
        dom.textContent = "";

        const icon = createPageIcon(linkedPage);
        const title = document.createElement("span");
        title.className = "page-link__title";
        title.textContent = nextTitle;

        dom.append(icon, title);
      };

      dom.setAttribute("data-type", "page-link");
      dom.setAttribute("data-page-id", pageId);
      dom.setAttribute("data-workspace-id", workspaceId || "");
      dom.setAttribute("href", `/workspace/${workspaceId}?page=${pageId}`);
      dom.className = "page-link";
      updateLabel();
      dom.style.color = "var(--color-accent)";
      dom.style.textDecoration = "none";
      dom.style.cursor = "pointer";
      dom.style.fontWeight = "500";

      dom.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/workspace/${workspaceId}?page=${pageId}`;
      });

      const unsubscribe = usePageStore.subscribe(updateLabel);

      return {
        dom,
        update: () => {
          updateLabel();
          return true;
        },
        destroy: unsubscribe,
      };
    };
  },

  addCommands() {
    return {
      insertPageLink:
        (attrs: PageLinkAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
