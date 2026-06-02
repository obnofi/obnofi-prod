import { useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { usePageStore } from "@/store/pageStore";
import type { SlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";

export function showToast(message: string) {
  const existing = document.getElementById("slash-cmd-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "slash-cmd-toast";
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#18181b",
    color: "#fafafa",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    zIndex: "100000",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity 0.15s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
  });
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 2200);
}

interface UseSlashCommandSelectOptions {
  editor: Editor;
  range: { from: number; to: number };
  workspaceId?: string;
  pageId?: string;
  onLinkDatabase?: () => void;
  onInsertButton?: () => void;
  onInsertPageLink?: () => void;
}

export function useSlashCommandSelect({
  editor,
  range,
  workspaceId,
  pageId,
  onLinkDatabase,
  onInsertButton,
  onInsertPageLink,
}: UseSlashCommandSelectOptions) {
  const router = useRouter();
  const { createPage } = usePageStore();

  return useCallback(
    (item: SlashCommandItem) => {
      if (item.isDisabled) {
        showToast("준비 중입니다 🚧");
        return;
      }

      const chain = editor.chain().focus().deleteRange(range);

      switch (item.id) {
        case "text":
          chain.setParagraph().run();
          break;
        case "h1":
          chain.setHeading({ level: 1 }).run();
          break;
        case "h2":
          chain.setHeading({ level: 2 }).run();
          break;
        case "h3":
          chain.setHeading({ level: 3 }).run();
          break;
        case "h4":
          chain.setHeading({ level: 4 }).run();
          break;
        case "h5":
          chain.setHeading({ level: 5 }).run();
          break;
        case "h6":
          chain.setHeading({ level: 6 }).run();
          break;
        case "bulletList":
          chain.toggleBulletList().run();
          break;
        case "orderedList":
          chain.toggleOrderedList().run();
          break;
        case "taskList":
          (chain as typeof chain & { toggleTaskList: () => typeof chain })
            .toggleTaskList()
            .run();
          break;
        case "blockquote":
          chain.toggleBlockquote().run();
          break;
        case "divider":
          chain.setHorizontalRule().run();
          break;
        case "codeBlock":
          (chain as typeof chain & { insertCodeBlock: () => typeof chain })
            .insertCodeBlock()
            .run();
          break;
        case "image":
          (
            chain as typeof chain & {
              insertGroveImageBlock: () => typeof chain;
            }
          )
            .insertGroveImageBlock()
            .run();
          break;
        case "dbTable":
          chain.insertDatabaseEmbed().run();
          break;
        case "canvas":
        case "mindMap":
          chain.insertCanvasEmbed().run();
          break;
        case "dbDiagram":
          (chain as typeof chain & { insertDbDiagram: () => typeof chain })
            .insertDbDiagram()
            .run();
          break;
        case "githubEmbed":
        case "githubGist":
        case "githubIssue":
          (
            chain as typeof chain & {
              insertGitHubEmbedBlock: () => typeof chain;
            }
          )
            .insertGitHubEmbedBlock()
            .run();
          break;
        case "columns2":
          chain.insertColumnLayout({ columns: 2 }).run();
          break;
        case "columns3":
          chain.insertColumnLayout({ columns: 3 }).run();
          break;
        case "math":
          chain.insertMathBlock().run();
          break;
        case "button":
          chain.run();
          onInsertButton?.();
          return;
        case "linkDatabase":
          chain.run();
          onLinkDatabase?.();
          break;
        case "pageLink":
        case "pageMention":
          chain.run();
          onInsertPageLink?.();
          return;
        case "template-meeting":
          chain.run();
          editor.commands.insertContent(
            `<h1>회의록</h1><p><strong>일시:</strong> </p><p><strong>참석자:</strong> </p><h2>안건</h2><ul><li><p></p></li></ul><h2>메모</h2><p></p><h2>액션 아이템</h2><ul><li><p></p></li></ul>`
          );
          break;
        case "template-project":
          chain.run();
          editor.commands.insertContent(
            `<h1>프로젝트 브리프</h1><h2>개요</h2><p></p><h2>목표</h2><ul><li><p></p></li></ul><h2>범위</h2><p></p><h2>결과물</h2><ul><li><p></p></li></ul><h2>일정</h2><p></p>`
          );
          break;
        case "template-weekly":
          chain.run();
          editor.commands.insertContent(
            `<h1>주간 플래너</h1><h2>이번 주 목표</h2><ul><li><p></p></li></ul><h2>월</h2><p></p><h2>화</h2><p></p><h2>수</h2><p></p><h2>목</h2><p></p><h2>금</h2><p></p><h2>회고</h2><p></p>`
          );
          break;
        case "subPage":
          chain.run();
          (async () => {
            if (!workspaceId || !pageId) return;
            const newPage = await createPage({
              title: "새 페이지",
              type: "document",
              parentId: pageId,
              workspaceId,
            });
            if (newPage) {
              editor.commands.insertSubPageEmbed({
                pageId: newPage.id,
                workspaceId,
                parentPageId: pageId,
              });
              router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
            }
          })();
          return;
        default:
          chain.run();
      }
    },
    [
      editor,
      range,
      workspaceId,
      pageId,
      createPage,
      router,
      onLinkDatabase,
      onInsertButton,
      onInsertPageLink,
    ]
  );
}
