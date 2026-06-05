import { PageType } from "@obnofi/types";

export const typeIcons: Record<PageType, string> = {
  document: "📄",
  canvas: "🎨",
  database: "🗄️",
  mindmap: "🧠",
};

export const typeLabels: Record<PageType, string> = {
  document: "Document",
  canvas: "Canvas",
  database: "Database",
  mindmap: "Mind Map",
};

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
