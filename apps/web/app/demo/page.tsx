"use client";

import {
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  Plus,
  FileText,
  Home,
  CheckSquare,
  Palette,
  BookOpen,
  Clock,
  Sparkles,
} from "lucide-react";

export default function DemoPage() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-60 border-r border-gray-200 bg-[#fbfbfa] flex flex-col h-full overflow-hidden">
        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="w-[22px] h-[22px] bg-[#2e7d45] rounded flex items-center justify-center shrink-0">
            <span className="text-white text-[12px] font-semibold">A</span>
          </div>
          <span className="flex-1 text-[14px] font-medium text-[#1a1a1a] truncate">
            Acme Workspace
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>

        {/* Quick Actions */}
        <div className="px-2 flex flex-col gap-0.5">
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
            <Search className="w-4 h-4" />
            Search
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
            <Plus className="w-4 h-4" />
            New page
          </button>
        </div>

        {/* Favorites */}
        <div className="px-2 mt-4">
          <div className="px-2 py-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            Favorites
          </div>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <FileText className="w-4 h-4" />
              Getting Started
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <FileText className="w-4 h-4" />
              Meeting Notes
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <FileText className="w-4 h-4" />
              Project Roadmap
            </button>
          </div>
        </div>

        {/* Private */}
        <div className="px-2 mt-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              Private
            </span>
            <Plus className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <ChevronDown className="w-3.5 h-3.5" />
              <CheckSquare className="w-4 h-4" />
              Task List
            </button>
            <div className="pl-7 flex flex-col gap-0.5">
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
                <FileText className="w-4 h-4" />
                Sprint Planning Backlog
              </button>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
                <FileText className="w-4 h-4" />
                Design System Notes
              </button>
            </div>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <ChevronDown className="w-3.5 h-3.5" />
              <Palette className="w-4 h-4" />
              Design System
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <ChevronDown className="w-3.5 h-3.5" />
              <BookOpen className="w-4 h-4" />
              Journal
            </button>
          </div>
        </div>

        {/* Team Space */}
        <div className="px-2 mt-4 flex-1 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            Team Space
          </div>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <ChevronDown className="w-3.5 h-3.5" />
              <Home className="w-4 h-4" />
              Project A
            </button>
            <div className="pl-5 flex flex-col gap-0.5">
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px] pl-4">
                <FileText className="w-4 h-4" />
                Overview
              </button>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px] pl-4">
                <ChevronDown className="w-3.5 h-3.5" />
                <FileText className="w-4 h-4" />
                Milestones
              </button>
              <div className="pl-7 flex flex-col gap-0.5">
                <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px] pl-4">
                  <FileText className="w-4 h-4" />
                  Phase 1
                </button>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px] pl-4">
                  <FileText className="w-4 h-4" />
                  Phase 2
                </button>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px] pl-4">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <FileText className="w-4 h-4" />
                  Phase 3
                </button>
              </div>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px] pl-4">
                <FileText className="w-4 h-4" />
                Resources
              </button>
            </div>
          </div>
        </div>

        {/* Recent */}
        <div className="border-t border-gray-200 px-2 py-2 shrink-0">
          <div className="px-2 py-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            Recent
          </div>
          <div className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <Clock className="w-3.5 h-3.5" />
              Meeting Notes
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <Clock className="w-3.5 h-3.5" />
              Q2 Roadmap
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <Clock className="w-3.5 h-3.5" />
              Design System
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200/70 text-gray-600 text-[13px]">
              <Clock className="w-3.5 h-3.5" />
              Sprint Planning
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-12 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-gray-500" />
            <span className="text-[14px] text-gray-700">Demo Page</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded">
              Share
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Sparkles className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Empty Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-12 py-12">
            <input
              type="text"
              placeholder="Untitled"
              className="w-full text-[40px] font-bold text-gray-900 placeholder:text-gray-300 border-none outline-none bg-transparent"
            />
            <p className="mt-4 text-gray-400 text-[16px]">
              Start typing or use / to see commands
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
