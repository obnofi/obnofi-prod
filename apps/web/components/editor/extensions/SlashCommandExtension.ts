import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { createSlashSuggestion } from "./SlashSuggestion";

export type SlashCommandItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  shortcut?: string;
  isDisabled?: boolean;
  isObnofi?: boolean;
  keywords?: string[];
};

export type SlashCommandCategory = {
  id: string;
  label: string;
};

export const CATEGORIES: SlashCommandCategory[] = [
  { id: "basic", label: "기본 블록" },
  { id: "media", label: "미디어" },
  { id: "code", label: "코드" },
  { id: "database", label: "데이터베이스" },
  { id: "canvas", label: "캔버스 / 그래프" },
  { id: "developer", label: "개발자 특화" },
  { id: "advanced", label: "고급 블록" },
  { id: "page", label: "페이지" },
  { id: "embed", label: "임베드" },
  { id: "inline", label: "인라인" },
];

export const slashCommands: SlashCommandItem[] = [
  // ── 기본 블록 ────────────────────────────────────────────────
  {
    id: "text",
    title: "텍스트",
    description: "일반 텍스트 단락",
    icon: "Type",
    category: "basic",
    keywords: ["text", "paragraph", "텍스트", "단락"],
  },
  {
    id: "h1",
    title: "제목 1",
    description: "최상위 수준 제목",
    icon: "Heading1",
    category: "basic",
    shortcut: "#",
    keywords: ["heading", "h1", "제목"],
  },
  {
    id: "h2",
    title: "제목 2",
    description: "두 번째 수준 제목",
    icon: "Heading2",
    category: "basic",
    shortcut: "##",
    keywords: ["heading", "h2", "제목"],
  },
  {
    id: "h3",
    title: "제목 3",
    description: "세 번째 수준 제목",
    icon: "Heading3",
    category: "basic",
    shortcut: "###",
    keywords: ["heading", "h3", "제목"],
  },
  {
    id: "h4",
    title: "제목 4",
    description: "네 번째 수준 제목",
    icon: "Heading4",
    category: "basic",
    shortcut: "####",
    keywords: ["heading", "h4", "제목"],
  },
  {
    id: "h5",
    title: "제목 5",
    description: "다섯 번째 수준 제목",
    icon: "Heading5",
    category: "basic",
    keywords: ["heading", "h5", "제목"],
  },
  {
    id: "h6",
    title: "제목 6",
    description: "여섯 번째 수준 제목",
    icon: "Heading6",
    category: "basic",
    keywords: ["heading", "h6", "제목"],
  },
  {
    id: "bulletList",
    title: "글머리 목록",
    description: "순서 없는 불릿 목록",
    icon: "List",
    category: "basic",
    shortcut: "-",
    keywords: ["bullet", "list", "글머리", "목록"],
  },
  {
    id: "orderedList",
    title: "번호 목록",
    description: "번호 매기기 목록",
    icon: "ListOrdered",
    category: "basic",
    shortcut: "1.",
    keywords: ["ordered", "numbered", "번호", "목록"],
  },
  {
    id: "taskList",
    title: "할일 목록",
    description: "체크박스 할일 목록",
    icon: "CheckSquare",
    category: "basic",
    isDisabled: true,
    keywords: ["task", "todo", "check", "할일", "체크"],
  },
  {
    id: "toggleList",
    title: "토글 목록",
    description: "접을 수 있는 목록",
    icon: "ChevronRight",
    category: "basic",
    shortcut: "gt",
    isDisabled: true,
    keywords: ["toggle", "토글", "접기"],
  },
  {
    id: "blockquote",
    title: "인용",
    description: "인용문 블록",
    icon: "Quote",
    category: "basic",
    shortcut: ">",
    keywords: ["quote", "blockquote", "인용"],
  },
  {
    id: "divider",
    title: "구분선",
    description: "수평 구분선",
    icon: "Minus",
    category: "basic",
    shortcut: "---",
    keywords: ["divider", "hr", "rule", "구분선"],
  },
  {
    id: "callout",
    title: "콜아웃",
    description: "강조 메시지 박스",
    icon: "AlertCircle",
    category: "basic",
    isDisabled: true,
    keywords: ["callout", "alert", "콜아웃", "강조"],
  },
  {
    id: "tableBlock",
    title: "표",
    description: "행과 열로 구성된 표",
    icon: "Table",
    category: "basic",
    isDisabled: true,
    keywords: ["table", "표", "행", "열"],
  },
  {
    id: "toc",
    title: "목차",
    description: "페이지 목차 자동 생성",
    icon: "BookOpen",
    category: "basic",
    isDisabled: true,
    keywords: ["toc", "contents", "목차"],
  },

  // ── 미디어 ──────────────────────────────────────────────────
  {
    id: "image",
    title: "이미지",
    description: "이미지 업로드 또는 URL 삽입",
    icon: "Image",
    category: "media",
    isDisabled: true,
    keywords: ["image", "photo", "이미지", "사진"],
  },
  {
    id: "video",
    title: "동영상",
    description: "동영상 업로드 또는 URL 삽입",
    icon: "Video",
    category: "media",
    isDisabled: true,
    keywords: ["video", "movie", "동영상"],
  },
  {
    id: "audio",
    title: "오디오",
    description: "오디오 파일 업로드",
    icon: "Music",
    category: "media",
    isDisabled: true,
    keywords: ["audio", "sound", "오디오", "음악"],
  },
  {
    id: "file",
    title: "파일",
    description: "파일 첨부",
    icon: "Paperclip",
    category: "media",
    isDisabled: true,
    keywords: ["file", "attachment", "파일", "첨부"],
  },
  {
    id: "bookmark",
    title: "북마크",
    description: "링크를 북마크로 저장",
    icon: "Bookmark",
    category: "media",
    isDisabled: true,
    keywords: ["bookmark", "link", "북마크"],
  },

  // ── 코드 ────────────────────────────────────────────────────
  {
    id: "codeBlock",
    title: "코드 블록",
    description: "언어 선택 + 실행 분할뷰",
    icon: "Code2",
    category: "code",
    keywords: ["code", "코드", "snippet", "언어"],
  },
  {
    id: "mermaid",
    title: "Mermaid",
    description: "다이어그램 및 플로우차트",
    icon: "GitBranch",
    category: "code",
    isDisabled: true,
    keywords: ["mermaid", "diagram", "chart", "다이어그램", "플로우"],
  },

  // ── 데이터베이스 ─────────────────────────────────────────────
  {
    id: "dbTable",
    title: "표 보기",
    description: "데이터베이스 표 보기",
    icon: "Table2",
    category: "database",
    keywords: ["database", "table", "표", "데이터베이스"],
  },
  {
    id: "dbBoard",
    title: "보드 보기",
    description: "칸반 보드 보기",
    icon: "Kanban",
    category: "database",
    isDisabled: true,
    keywords: ["board", "kanban", "보드"],
  },
  {
    id: "dbGallery",
    title: "갤러리 보기",
    description: "카드 갤러리 보기",
    icon: "LayoutGrid",
    category: "database",
    isDisabled: true,
    keywords: ["gallery", "갤러리", "카드"],
  },
  {
    id: "dbList",
    title: "리스트 보기",
    description: "간단한 목록 보기",
    icon: "LayoutList",
    category: "database",
    isDisabled: true,
    keywords: ["list", "리스트"],
  },
  {
    id: "dbCalendar",
    title: "캘린더 보기",
    description: "달력 형식 보기",
    icon: "Calendar",
    category: "database",
    isDisabled: true,
    keywords: ["calendar", "캘린더", "달력"],
  },
  {
    id: "dbTimeline",
    title: "타임라인 보기",
    description: "간트 차트 형식",
    icon: "GanttChart",
    category: "database",
    isDisabled: true,
    keywords: ["timeline", "gantt", "타임라인", "간트"],
  },

  // ── 캔버스 / 그래프 (obnofi 전용) ────────────────────────────
  {
    id: "canvas",
    title: "Clearing",
    description: "FigJam 스타일 무한 캔버스를 인라인 블록으로 삽입",
    icon: "PenTool",
    category: "canvas",
    isObnofi: true,
    keywords: ["canvas", "clearing", "figjam", "draw", "캔버스", "클리어링", "그리기"],
  },
  {
    id: "dbDiagram",
    title: "DB 다이어그램",
    description: "SQL ↔ ERD 양방향 동기화 다이어그램",
    icon: "Database",
    category: "canvas",
    isObnofi: true,
    keywords: ["er", "diagram", "erd", "db", "diagram", "sql", "다이어그램", "데이터베이스"],
  },
  {
    id: "graphView",
    title: "그래프 뷰",
    description: "페이지 연결 그래프",
    icon: "Network",
    category: "canvas",
    isDisabled: true,
    isObnofi: true,
    keywords: ["graph", "network", "그래프"],
  },

  // ── 개발자 특화 (obnofi 전용) ─────────────────────────────────
  {
    id: "apiTester",
    title: "API 테스터",
    description: "HTTP 요청 테스트",
    icon: "Zap",
    category: "developer",
    isDisabled: true,
    isObnofi: true,
    keywords: ["api", "http", "rest", "테스터"],
  },
  {
    id: "githubGist",
    title: "GitHub Gist",
    description: "Gist 코드 스니펫 임베드",
    icon: "GitGraph",
    category: "developer",
    isDisabled: true,
    isObnofi: true,
    keywords: ["gist", "github", "code", "스니펫"],
  },
  {
    id: "githubIssue",
    title: "GitHub 이슈 / PR",
    description: "이슈 또는 PR 임베드",
    icon: "GitPullRequest",
    category: "developer",
    isDisabled: true,
    isObnofi: true,
    keywords: ["issue", "pr", "github", "이슈"],
  },

  // ── 고급 블록 ────────────────────────────────────────────────
  {
    id: "toggleH1",
    title: "제목 토글 1",
    description: "접을 수 있는 제목 1",
    icon: "ChevronDown",
    category: "advanced",
    isDisabled: true,
    keywords: ["toggle", "heading", "토글", "제목"],
  },
  {
    id: "toggleH2",
    title: "제목 토글 2",
    description: "접을 수 있는 제목 2",
    icon: "ChevronDown",
    category: "advanced",
    isDisabled: true,
    keywords: ["toggle", "heading", "토글", "제목"],
  },
  {
    id: "toggleH3",
    title: "제목 토글 3",
    description: "접을 수 있는 제목 3",
    icon: "ChevronDown",
    category: "advanced",
    isDisabled: true,
    keywords: ["toggle", "heading", "토글", "제목"],
  },
  {
    id: "columns2",
    title: "2열 레이아웃",
    description: "2열 나란히 레이아웃",
    icon: "Columns2",
    category: "advanced",
    keywords: ["column", "layout", "2열"],
  },
  {
    id: "columns3",
    title: "3열 레이아웃",
    description: "3열 나란히 레이아웃",
    icon: "Columns3",
    category: "advanced",
    keywords: ["column", "layout", "3열"],
  },
  {
    id: "math",
    title: "수학 공식",
    description: "LaTeX 수식 블록 렌더링",
    icon: "Sigma",
    category: "advanced",
    keywords: ["math", "latex", "formula", "수식"],
  },
  {
    id: "button",
    title: "버튼",
    description: "클릭 가능한 버튼",
    icon: "Square",
    category: "advanced",
    keywords: ["button", "버튼"],
  },
  {
    id: "pageLink",
    title: "페이지 링크",
    description: "다른 페이지로 링크",
    icon: "Link",
    category: "advanced",
    keywords: ["page", "link", "페이지", "링크"],
  },
  {
    id: "template",
    title: "템플릿",
    description: "재사용 가능한 콘텐츠 블록",
    icon: "LayoutTemplate",
    category: "advanced",
    keywords: ["template", "템플릿"],
  },
  {
    id: "template-meeting",
    title: "회의록",
    description: "안건, 메모, 액션 아이템 양식",
    icon: "ClipboardList",
    category: "advanced",
    keywords: ["template", "meeting", "회의", "회의록", "템플릿"],
  },
  {
    id: "template-project",
    title: "프로젝트 브리프",
    description: "범위, 목표, 결과물 정의 양식",
    icon: "FileText",
    category: "advanced",
    keywords: ["template", "project", "프로젝트", "브리프", "템플릿"],
  },
  {
    id: "template-weekly",
    title: "주간 플래너",
    description: "이번 주 할일과 일정 양식",
    icon: "CalendarDays",
    category: "advanced",
    keywords: ["template", "weekly", "주간", "플래너", "템플릿"],
  },

  // ── 페이지 ──────────────────────────────────────────────────
  {
    id: "subPage",
    title: "하위 페이지",
    description: "현재 페이지 안에 새 페이지 만들기",
    icon: "FileText",
    category: "page",
    keywords: ["page", "subpage", "하위", "페이지", "서브"],
  },

  // ── 임베드 ──────────────────────────────────────────────────
  {
    id: "embed",
    title: "링크 임베드",
    description: "URL을 임베드로 삽입",
    icon: "Globe",
    category: "embed",
    isDisabled: true,
    keywords: ["embed", "url", "link", "임베드"],
  },
  {
    id: "googleDrive",
    title: "Google Drive",
    description: "구글 드라이브 파일 임베드",
    icon: "HardDrive",
    category: "embed",
    isDisabled: true,
    keywords: ["google", "drive", "구글"],
  },
  {
    id: "tweet",
    title: "Tweet",
    description: "트위터/X 게시물 임베드",
    icon: "MessageSquare",
    category: "embed",
    isDisabled: true,
    keywords: ["tweet", "twitter", "x", "트위터"],
  },

  // ── 인라인 ──────────────────────────────────────────────────
  {
    id: "mention",
    title: "사용자 멘션",
    description: "@이름으로 사용자 언급",
    icon: "AtSign",
    category: "inline",
    isDisabled: true,
    keywords: ["mention", "user", "멘션"],
  },
  {
    id: "pageMention",
    title: "페이지 멘션",
    description: "[[페이지명]]으로 페이지 링크",
    icon: "FileText",
    category: "inline",
    keywords: ["page", "mention", "link", "페이지"],
  },
  {
    id: "dateReminder",
    title: "날짜 / 리마인더",
    description: "@날짜로 날짜 삽입",
    icon: "CalendarDays",
    category: "inline",
    isDisabled: true,
    keywords: ["date", "reminder", "날짜", "리마인더"],
  },
  {
    id: "emoji",
    title: "이모지",
    description: ":이름:으로 이모지 삽입",
    icon: "Smile",
    category: "inline",
    isDisabled: true,
    keywords: ["emoji", "이모지"],
  },
  {
    id: "inlineMath",
    title: "인라인 수식",
    description: "인라인 수학 공식",
    icon: "Sigma",
    category: "inline",
    isDisabled: true,
    keywords: ["math", "formula", "수식", "인라인"],
  },
];

export function getSlashCommandItems(query: string): SlashCommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return slashCommands;
  return slashCommands.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords?.some((kw) => kw.includes(q))
  );
}

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      workspaceId: undefined as string | undefined,
      pageId: undefined as string | undefined,
      onLinkDatabase: undefined as (() => void) | undefined,
      onInsertButton: undefined as (() => void) | undefined,
      onInsertPageLink: undefined as (() => void) | undefined,
    };
  },

  addProseMirrorPlugins() {
    const { workspaceId, pageId, onLinkDatabase, onInsertButton, onInsertPageLink } = this.options;
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => getSlashCommandItems(query),
        render: createSlashSuggestion(workspaceId, pageId, onLinkDatabase, onInsertButton, onInsertPageLink),
      }),
    ];
  },
});
