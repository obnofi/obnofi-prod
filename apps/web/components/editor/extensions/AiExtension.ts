import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { AiCommandItem, AiCommandType } from "@obnofi/types/ai";
import { aiSuggestion } from "./AiSuggestion";

export const aiCommands: AiCommandItem[] = [
  {
    id: "continue",
    title: "계속 쓰기",
    description: "이어서 글을 작성합니다",
    icon: "Pencil",
  },
  {
    id: "summarize",
    title: "요약하기",
    description: "선택한 텍스트를 요약합니다",
    icon: "AlignLeft",
  },
  {
    id: "improve",
    title: "개선하기",
    description: "글을 더 명확하고 전문적으로 만듭니다",
    icon: "Sparkles",
  },
  {
    id: "shorter",
    title: "짧게 줄이기",
    description: "텍스트를 간결하게 만듭니다",
    icon: "Minimize2",
  },
  {
    id: "longer",
    title: "길게 늘이기",
    description: "더 자세한 내용으로 확장합니다",
    icon: "Maximize2",
  },
  {
    id: "translate",
    title: "한국어로 번역",
    description: "텍스트를 한국어로 번역합니다",
    icon: "Languages",
  },
  {
    id: "explain",
    title: "설명하기",
    description: "쉬운 용어로 설명합니다",
    icon: "HelpCircle",
  },
  {
    id: "code",
    title: "코드 작성",
    description: "설명을 바탕으로 코드를 작성합니다",
    icon: "Code",
  },
];

export const AiExtension = Extension.create({
  name: "ai",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        ...aiSuggestion,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export function getAiCommandItems(query: string): AiCommandItem[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return aiCommands;
  }

  return aiCommands.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery)
  );
}
