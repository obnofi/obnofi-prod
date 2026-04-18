"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  Plus,
  FileText,
  Home,
  CheckSquare,
  Palette,
  BookOpen,
  Clock,
  MoreHorizontal,
  Share,
  Sparkles,
  Loader2,
  Database,
  Orbit,
  Check,
  AlertCircle,
  Copy,
  Table,
  LayoutGrid,
  Calendar,
  GalleryHorizontal,
  List,
  Clock3,
  Tag,
  CalendarDays,
  Type,
  ListFilter,
  CheckSquare2,
  User,
  FileEdit,
  Eye,
  ArrowRight,
  MessageSquare,
  Users,
  AtSign,
} from "lucide-react";
import { Editor } from "@/components/editor/Editor";
import { Canvas } from "@/components/canvas/Canvas";
import { DatabaseWorkspace } from "@/components/database/DatabaseWorkspace";
import { SharePopover } from "@/components/share/SharePopover";
import { DatabaseViewModal } from "@/components/database/DatabaseViewModal";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import { PageType } from "@/types";
import { useUIStore } from "@/store/useUIStore";

interface WorkspacePageProps {
  workspaceId: string;
  pageId: string;
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

// Status badge component (demo style)
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "Done": "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "To Do": "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors["To Do"]}`}>
      {status}
    </span>
  );
}

// Tag badge component (demo style)
function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    "Design": "bg-purple-100 text-purple-700",
    "Urgent": "bg-red-100 text-red-700",
    "Engineering": "bg-blue-100 text-blue-700",
    "Research": "bg-green-100 text-green-700",
    "Planning": "bg-orange-100 text-orange-700",
    "Meeting": "bg-yellow-100 text-yellow-700",
    "Product": "bg-pink-100 text-pink-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[tag] || "bg-gray-100 text-gray-700"}`}>
      {tag}
    </span>
  );
}

export function WorkspacePage({ workspaceId, pageId }: WorkspacePageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingChildType, setPendingChildType] = useState<PageType | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("table");

  const {
    currentPage,
    pages,
    fetchPage,
    fetchPages,
    updatePage,
    createPage,
    setCurrentPage,
    getPageTree,
  } = usePageStore();

  useEffect(() => {
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      await fetchPage(pageId);
      setIsLoading(false);
    };
    loadPage();
  }, [pageId, fetchPage]);

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title);
    }
  }, [currentPage]);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    await updatePage(pageId, { title: newTitle });
  };

  const handleContentUpdate = async (content: object) => {
    await updatePage(pageId, { content });
  };

  const handleToggleExpand = (pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSelectPage = (selectedPageId: string) => {
    router.push(`/workspace/${workspaceId}?page=${selectedPageId}`);
  };

  const { openDatabaseModal } = useUIStore();

  const handleOpenDatabaseModal = (databaseId: string | null | undefined, title: string) => {
    if (databaseId) {
      openDatabaseModal(databaseId, title);
    }
  };

  useEffect(() => {
    const handleShareUpdate = (e: Event) => {
      const { isPublic, shareId } = (e as CustomEvent).detail;
      if (currentPage) {
        setCurrentPage({ ...currentPage, isPublic, shareId });
      }
    };
    window.addEventListener("share-update", handleShareUpdate);
    return () => window.removeEventListener("share-update", handleShareUpdate);
  }, [currentPage, setCurrentPage]);

  const handleCreateChildPage = async (type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Canvas",
      database: "New Database",
    };

    setPendingChildType(type);

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId: pageId,
      workspaceId,
    });

    setPendingChildType(null);

    if (newPage) {
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  const handleCreatePage = async (type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Canvas",
      database: "New Database",
    };

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId: null,
      workspaceId,
    });

    if (newPage) {
      setShowNewPageMenu(false);
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  // Get recent pages
  const recentPages = [...pages]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  // Get favorites (pages at root level for now)
  const favoritePages = pages.filter(p => !p.parentId).slice(0, 3);

  // Get page tree
  const pageTree = getPageTree();

  // Demo data
  const tasks = [
    { id: "1", name: "Homepage Redesign", status: "Done" as const, date: "Apr 15, 2024", tags: ["Design", "Urgent"] },
    { id: "2", name: "API Documentation", status: "In Progress" as const, date: "Apr 16, 2024", tags: ["Engineering"] },
    { id: "3", name: "User Research", status: "Done" as const, date: "Apr 10, 2024", tags: ["Research"] },
    { id: "4", name: "Sprint Retrospective", status: "To Do" as const, date: "Apr 18, 2024", tags: ["Planning", "Meeting"] },
    { id: "5", name: "Onboarding Flow", status: "In Progress" as const, date: "Apr 20, 2024", tags: ["Design", "Product"] },
  ];

  const boardColumns = {
    todo: { name: "To Do", count: 1, cards: [{ id: "1", name: "Homepage Redesign", tag: "Design" }] },
    doing: { name: "In Progress", count: 2, cards: [
      { id: "2", name: "API Documentation Update", tag: "Engineering" },
      { id: "3", name: "User Research Analysis", tag: "Research" }
    ]},
    done: { name: "Done", count: 2, cards: [
      { id: "4", name: "Sprint Planning", tag: "" },
      { id: "5", name: "Q2 Roadmap Review", tag: "" }
    ]},
  };

  const projects = [
    { id: "1", name: "Website Redesign", tasks: 2, status: "In Progress" },
    { id: "2", name: "Mobile App", tasks: 2, status: "In Progress" },
  ];

  const properties = [
    { icon: Type, name: "Title" },
    { icon: ListFilter, name: "Status" },
    { icon: CheckSquare2, name: "Checkbox" },
    { icon: CalendarDays, name: "Date" },
    { icon: Tag, name: "Tags" },
    { icon: User, name: "Person" },
    { icon: FileEdit, name: "Files" },
    { icon: Eye, name: "URL" },
  ];

  const templates = [
    { icon: CheckSquare, title: "Meeting Notes", desc: "Capture agenda, notes, and action items" },
    { icon: FileText, title: "Project Brief", desc: "Define scope, goals, and deliverables" },
    { icon: Clock, title: "Weekly Planner", desc: "Plan your week with tasks and events" },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-white">
        <aside className="w-60 border-r border-gray-200 bg-[#fbfbfa] flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-3">
            <div className="w-[22px] h-[22px] bg-[#2e7d45] rounded flex items-center justify-center shrink-0">
              <span className="text-white text-[12px] font-semibold">W</span>
            </div>
            <span className="flex-1 text-[14px] font-medium text-[#1a1a1a] truncate">Workspace</span>
          </div>
        </aside>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#2E7D45] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex h-screen bg-white">
        <aside className="w-60 border-r border-gray-200 bg-[#fbfbfa] flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-3">
            <div className="w-[22px] h-[22px] bg-[#2e7d45] rounded flex items-center justify-center shrink-0">
              <span className="text-white text-[12px] font-semibold">W</span>
            </div>
            <span className="flex-1 text-[14px] font-medium text-[#1a1a1a] truncate">Workspace</span>
          </div>
        </aside>
        <div className="flex-1 flex items-center justify-center text-gray-500">Page not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Demo Style */}
      <aside className="w-60 border-r border-gray-200 bg-[#fbfbfa] flex flex-col h-full overflow-hidden">
        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="w-[22px] h-[22px] bg-[#2e7d45] rounded flex items-center justify-center shrink-0">
            <span className="text-white text-[12px] font-semibold">W</span>
          </div>
          <span className="flex-1 text-[14px] font-medium text-[#1a1a1a] truncate">Workspace</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>

        {/* Quick Actions */}
        <div className="px-2 flex flex-col gap-0.5">
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
            <Search className="w-4 h-4" />Search
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
            <Settings className="w-4 h-4" />Settings
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowNewPageMenu(!showNewPageMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px] w-full text-left"
            >
              <Plus className="w-4 h-4" />New page
            </button>
            {showNewPageMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {(["document", "database"] as PageType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleCreatePage(type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {typeIcons[type]}
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link href={`/workspace/${workspaceId}/graph`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
            <Orbit className="w-4 h-4" />Graph View
          </Link>
        </div>

        {/* Favorites */}
        {favoritePages.length > 0 && (
          <div className="px-2 mt-4">
            <div className="px-2 py-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">Favorites</div>
            <div className="flex flex-col gap-0.5">
              {favoritePages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${
                    page.id === pageId ? "bg-gray-200/70 text-gray-900" : "hover:bg-gray-200/70 text-gray-600"
                  }`}
                >
                  {typeIcons[page.type]}
                  {page.title || "Untitled"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Private - Page Tree */}
        <div className="px-2 mt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Private</span>
            <button onClick={() => setShowNewPageMenu(!showNewPageMenu)} className="p-0.5 rounded hover:bg-gray-200/70">
              <Plus className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {pageTree.map((node) => (
              <PageTreeItem
                key={node.id}
                node={node}
                level={0}
                currentPageId={pageId}
                onSelect={handleSelectPage}
                onToggle={handleToggleExpand}
                expanded={expandedPages}
                onOpenDatabaseModal={handleOpenDatabaseModal}
              />
            ))}
          </div>
        </div>

        {/* Recent */}
        {recentPages.length > 0 && (
          <div className="border-t border-gray-200 px-2 py-2 shrink-0">
            <div className="px-2 py-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">Recent</div>
            <div className="flex flex-col gap-0.5">
              {recentPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${
                    page.id === pageId ? "bg-gray-200/70 text-gray-900" : "hover:bg-gray-200/70 text-gray-600"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {page.title || "Untitled"}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar - Demo Style */}
        <header className="h-12 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{typeIcons[currentPage.type]}</span>
            <span className="text-[14px] text-gray-700 truncate max-w-xs">{currentPage.title || "Untitled"}</span>
          </div>
          <div className="flex items-center gap-2">
            <SharePopover pageId={pageId} isPublic={currentPage.isPublic} shareId={currentPage.shareId} onShareUpdateAction="share-update" />
            <button className="p-2 hover:bg-gray-100 rounded"><Settings className="w-4 h-4 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-100 rounded"><Sparkles className="w-4 h-4 text-gray-600" /></button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentPage.type === "document" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto px-12 py-8">
                {/* Title */}
                <input
                  data-testid="workspace-page-title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled"
                  className="mb-6 w-full border-none bg-transparent text-[40px] font-bold text-[#111110] outline-none placeholder:text-gray-300 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                />

                {/* Mobile Add Buttons */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:hidden">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                    <Plus className="h-3.5 w-3.5" />Add to doc
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: "database" as const, label: "Database", description: "Table with rows", icon: <Database className="h-4 w-4" /> },
                    ].map((action) => {
                      const isPending = pendingChildType === action.type;
                      return (
                        <button
                          key={action.type}
                          type="button"
                          onClick={() => void handleCreateChildPage(action.type)}
                          disabled={pendingChildType !== null}
                          className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-[#2E7D45] hover:bg-[#F4FBF6] disabled:cursor-wait disabled:opacity-60"
                        >
                          <div className="flex w-full items-center justify-between text-[#2E7D45]">
                            <span className="rounded-lg bg-[#E8F3EC] p-2">{action.icon}</span>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{action.label}</div>
                            <div className="mt-1 text-xs text-gray-500">{action.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 1: Welcome */}
                <section className="mb-12">
                  <h1 className="text-[40px] font-bold text-gray-900 mb-4">Welcome to Notion</h1>
                  <p className="text-[16px] text-gray-600 mb-6 leading-relaxed">
                    This is a demo page showcasing various Notion features. Explore the sections below to see databases, collaboration tools, and page customization options in action.
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-[18px] h-[18px] rounded border border-emerald-500 bg-emerald-500 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[15px] text-gray-700">Create your first page</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-[18px] h-[18px] rounded border border-emerald-500 bg-emerald-500 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[15px] text-gray-700">Invite your team members</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[15px] text-gray-700">
                      Tip: Use the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">/</code> command to quickly add different block types like headings, lists, toggles, and more.
                    </p>
                  </div>
                </section>

                {/* Section 2: Toggle */}
                <section className="mb-8">
                  <button onClick={() => setIsCodeExpanded(!isCodeExpanded)} className="flex items-center gap-2 group">
                    <ChevronRight className={`w-[18px] h-[18px] text-gray-500 transition-transform ${isCodeExpanded ? "rotate-90" : ""}`} />
                    <span className="text-[18px] font-semibold text-gray-900">Click to expand</span>
                  </button>
                  <p className="text-[14px] text-gray-500 ml-6 mt-1">Hidden content revealed</p>
                  {isCodeExpanded && (
                    <div className="ml-6 mt-4">
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                          <span className="text-[13px] text-gray-400">javascript</span>
                          <Copy className="w-4 h-4 text-gray-400 cursor-pointer" />
                        </div>
                        <pre className="p-4 text-[14px] text-gray-300 overflow-x-auto">
                          <code>{`function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('Notion');`}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </section>

                {/* Section 3: Database */}
                <section className="mb-12">
                  <h2 className="text-[24px] font-semibold text-gray-900 mb-4">Database Example</h2>
                  <p className="text-[16px] text-gray-600 mb-6">
                    Notion databases are powerful tools for organizing information. Below is the same data shown in different views.
                  </p>
                  {/* Tabs */}
                  <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
                    {[
                      { id: "table", icon: Table, label: "Table" },
                      { id: "board", icon: LayoutGrid, label: "Board" },
                      { id: "calendar", icon: Calendar, label: "Calendar" },
                      { id: "gallery", icon: GalleryHorizontal, label: "Gallery" },
                      { id: "list", icon: List, label: "List" },
                      { id: "timeline", icon: Clock3, label: "Timeline" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-t transition-colors ${
                          activeTab === tab.id ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                    <span className="ml-4 text-[13px] text-gray-400">Same data, different views</span>
                  </div>

                  {/* Table View */}
                  {activeTab === "table" && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-3 py-2 text-[13px] font-medium text-gray-600">Name</th>
                            <th className="text-left px-3 py-2 text-[13px] font-medium text-gray-600 w-32">Status</th>
                            <th className="text-left px-3 py-2 text-[13px] font-medium text-gray-600 w-36">Date</th>
                            <th className="text-left px-3 py-2 text-[13px] font-medium text-gray-600">Tags</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task) => (
                            <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2 text-[14px] text-gray-900">{task.name}</td>
                              <td className="px-3 py-2"><StatusBadge status={task.status} /></td>
                              <td className="px-3 py-2 text-[14px] text-gray-600">{task.date}</td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1">
                                  {task.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Board View */}
                  {activeTab === "board" && (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {Object.entries(boardColumns).map(([key, column]) => (
                        <div key={key} className="w-[280px] shrink-0">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-2 h-2 rounded-full ${key === "todo" ? "bg-gray-400" : key === "doing" ? "bg-blue-400" : "bg-emerald-400"}`} />
                            <span className="text-[13px] font-medium text-gray-700">{column.name}</span>
                            <span className="text-[12px] text-gray-400">{column.count}</span>
                          </div>
                          <div className="space-y-2">
                            {column.cards.map((card) => (
                              <div key={card.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                <p className="text-[14px] text-gray-900 mb-2">{card.name}</p>
                                {card.tag ? <TagBadge tag={card.tag} /> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Calendar View */}
                  {activeTab === "calendar" && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <div key={day} className="text-center text-[12px] font-medium text-gray-500 py-2">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }, (_, i) => {
                          const day = i - 2;
                          const hasEvent = day === 15 || day === 19;
                          return (
                            <div key={i} className="aspect-square border border-gray-100 rounded p-1">
                              {day > 0 && day <= 30 && (
                                <>
                                  <span className="text-[12px] text-gray-600">{day}</span>
                                  {hasEvent && (
                                    <div className="mt-1 px-1.5 py-0.5 bg-blue-100 rounded text-[10px] text-blue-700 truncate">
                                      {day === 15 ? "Team Sync" : "Review"}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Gallery View */}
                  {activeTab === "gallery" && (
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { name: "Homepage Redesign", tag: "Design", color: "bg-purple-100" },
                        { name: "API Documentation", tag: "Engineering", color: "bg-blue-100" },
                        { name: "User Research", tag: "Research", color: "bg-green-100" },
                      ].map((item, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className={`h-24 ${item.color}`} />
                          <div className="p-3">
                            <p className="text-[14px] font-medium text-gray-900 mb-2">{item.name}</p>
                            <TagBadge tag={item.tag} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List View */}
                  {activeTab === "list" && (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="flex-1 text-[14px] text-gray-900">{task.name}</span>
                          <StatusBadge status={task.status} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timeline View */}
                  {activeTab === "timeline" && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex border-b border-gray-200 mb-4">
                        {["Week 1", "Week 2", "Week 3", "Week 4"].map((w) => (
                          <div key={w} className="flex-1 text-center text-[12px] font-medium text-gray-500 py-2">{w}</div>
                        ))}
                      </div>
                      {[
                        { name: "Homepage", width: "30%", offset: "10%" },
                        { name: "API Docs", width: "20%", offset: "0%" },
                        { name: "Research", width: "25%", offset: "5%" },
                        { name: "Sprint", width: "35%", offset: "15%" },
                        { name: "Onboarding", width: "15%", offset: "0%" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-2 mb-3">
                          <span className="w-24 text-[13px] text-gray-600 truncate">{item.name}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded relative">
                            <div className="absolute h-full bg-blue-400 rounded opacity-70" style={{ width: item.width, left: item.offset }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Section 4: Properties */}
                <section className="mb-12">
                  <h2 className="text-[22px] font-semibold text-gray-900 mb-2">Properties Panel</h2>
                  <p className="text-[15px] text-gray-600 mb-6">
                    Every database entry can have custom properties. Click to add a property to see available types.
                  </p>
                  <div className="w-80 border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {properties.map((prop) => (
                      <div key={prop.name} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                        <prop.icon className="w-4 h-4 text-gray-500" />
                        <span className="text-[14px] text-gray-700">{prop.name}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section 5: Relations */}
                <section className="mb-12">
                  <h2 className="text-[22px] font-semibold text-gray-900 mb-2">Section 6: Relations & Rollups</h2>
                  <p className="text-[15px] text-gray-600 mb-6">
                    Tables and Databases in Notion support Relations property, which helps aggregate data across items.
                  </p>
                  <div className="flex gap-6 mb-6">
                    {/* Tasks Database */}
                    <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <CheckSquare className="w-4 h-4 text-gray-600" />
                        <span className="text-[14px] font-medium text-gray-900">Tasks</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {[
                          { name: "Implement auth flow", rel: "Website Redesign" },
                          { name: "Write API documentation", rel: "Mobile App" },
                          { name: "Design landing page", rel: "Website Redesign" },
                          { name: "Setup CI/CD pipeline", rel: "Mobile App" },
                        ].map((task, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2">
                            <span className="text-[13px] text-gray-700">{task.name}</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">{task.rel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Projects Database */}
                    <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <Home className="w-4 h-4 text-gray-600" />
                        <span className="text-[14px] font-medium text-gray-900">Projects</span>
                      </div>
                      <div className="grid grid-cols-3 text-[11px] font-medium text-gray-500 px-3 py-2 border-b border-gray-100">
                        <span>Project Name</span>
                        <span>Tasks</span>
                        <span>Status</span>
                      </div>
                      {projects.map((proj) => (
                        <div key={proj.id} className="grid grid-cols-3 px-3 py-2 border-b border-gray-100 last:border-0">
                          <span className="text-[13px] text-gray-700">{proj.name}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600 w-fit">{proj.tasks} tasks</span>
                          <span className="text-[13px] text-gray-600">{proj.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Relation Indicator */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-[14px] text-gray-700">
                      Relation: Task entries in Project column are linked to entries in the Project database
                    </span>
                  </div>
                  {/* Arrow Visual */}
                  <div className="flex items-center justify-center gap-2 text-[14px] text-gray-600">
                    <span>Tasks</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">Projects</span>
                  </div>
                </section>

                {/* Section 6: Collaboration */}
                <section className="mb-12">
                  <h2 className="text-[22px] font-semibold text-gray-900 mb-2">Section 7: Collaboration</h2>
                  <p className="text-[15px] text-gray-600 mb-6">
                    Notion excels at team collaboration. Here&apos;s how comments, mentions, and real-time editing work.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Comment Bubble */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">Comments</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500" />
                          <span className="text-[12px] font-medium text-gray-700">Mike Johnson</span>
                          <span className="text-[11px] text-gray-400">2h ago</span>
                        </div>
                        <p className="text-[12px] text-gray-600">
                          This looks great! Can we add more details to the project timeline?
                        </p>
                      </div>
                    </div>
                    {/* User Presence */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-[13px] font-medium text-gray-700 mb-3">Live Collaboration</div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex -space-x-2">
                          {["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"].map((color, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white`} />
                          ))}
                        </div>
                        <span className="text-[12px] text-gray-500">+3 more</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-[12px] text-gray-600">Sarah editing...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-[12px] text-gray-600">Tom viewing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-[12px] text-gray-600">Alex viewing</span>
                        </div>
                      </div>
                    </div>
                    {/* Mentions */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-[13px] font-medium text-gray-700 mb-2">Mentions</div>
                      <p className="text-[12px] text-gray-500 mb-3">Use @ to mention people or pages</p>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-1 text-[12px]">
                          <span>Hey</span>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">@Sarah</span>
                          <span>can you review this?</span>
                        </div>
                        <div className="flex items-center gap-1 text-[12px]">
                          <span>Check out the</span>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">@Roadmap</span>
                          <span>for details</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Press @ to mention</p>
                    </div>
                  </div>
                </section>

                {/* Section 7: Buttons & Templates */}
                <section className="mb-12">
                  <h2 className="text-[22px] font-semibold text-gray-900 mb-2">Section 8: Buttons & Templates</h2>
                  <p className="text-[15px] text-gray-600 mb-6">
                    Quickly create pages from templates with one click.
                  </p>
                  <div className="flex items-center gap-3 mb-6">
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[14px] font-medium transition-colors">
                      <Plus className="w-4 h-4" />Add Task
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[14px] font-medium transition-colors">
                      <FileText className="w-4 h-4" />New Template
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {templates.map((template, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer">
                        <template.icon className="w-6 h-6 text-gray-600 mb-3" />
                        <h3 className="text-[15px] font-medium text-gray-900 mb-1">{template.title}</h3>
                        <p className="text-[13px] text-gray-500">{template.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Editor */}
                <Editor
                  content={currentPage.content}
                  editable={true}
                  onUpdate={handleContentUpdate}
                  placeholder="Type something..."
                  workspaceId={workspaceId}
                  pageId={pageId}
                />
              </div>
            </div>
          )}

          {currentPage.type === "canvas" && (
            <Canvas content={currentPage.content} onUpdate={handleContentUpdate} />
          )}

          {currentPage.type === "database" && (
            <DatabaseWorkspace pageId={pageId} workspaceId={workspaceId} />
          )}
        </div>
      </main>

      {/* Database View Modal - available on all pages */}
      <DatabaseViewModal />
    </div>
  );
}

// Page Tree Item Component
interface PageTreeItemProps {
  node: PageTreeNode;
  level: number;
  currentPageId: string;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  expanded: Set<string>;
  onOpenDatabaseModal?: (databaseId: string | null | undefined, title: string) => void;
}

function PageTreeItem({ node, level, currentPageId, onSelect, onToggle, expanded, onOpenDatabaseModal }: PageTreeItemProps) {
  const isExpanded = expanded.has(node.id);
  const isActive = node.id === currentPageId;
  const hasChildren = node.children.length > 0;
  const isDatabase = node.type === "database";

  const getIcon = (type: PageType) => {
    switch (type) {
      case "document": return <FileText className="w-4 h-4" />;
      case "canvas": return <Palette className="w-4 h-4" />;
      case "database": return <Database className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleDatabaseAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDatabaseModal && isDatabase) {
      onOpenDatabaseModal(node.databaseId, node.title);
    }
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1 rounded-md cursor-pointer transition-colors ${
          isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px`, paddingRight: "8px" }}
        onClick={() => onSelect(node.id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(node.id); }}
          className={`p-0.5 rounded transition-transform shrink-0 ${hasChildren ? "opacity-100" : "opacity-0"} ${isExpanded ? "rotate-90" : ""}`}
        >
          <ChevronRight className="w-3 h-3 text-gray-500" />
        </button>
        <span className="text-gray-500 shrink-0">{node.icon ? <span>{node.icon}</span> : getIcon(node.type)}</span>
        <span className="flex-1 text-[13px] truncate">{node.title || "Untitled"}</span>
        {isDatabase && onOpenDatabaseModal && (
          <button
            onClick={handleDatabaseAction}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity"
            title="Open database view"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
      </div>
      {isExpanded && node.children.map((child) => (
        <PageTreeItem
          key={child.id}
          node={child}
          level={level + 1}
          currentPageId={currentPageId}
          onSelect={onSelect}
          onToggle={onToggle}
          expanded={expanded}
          onOpenDatabaseModal={onOpenDatabaseModal}
        />
      ))}
    </div>
  );
}
