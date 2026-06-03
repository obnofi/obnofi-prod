"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { usePageStore } from "@/store/pageStore";
import { Page, PageType } from "@obnofi/types";
import { useUIStore } from "@/store/useUIStore";
import {
  CollaborationProvider,
} from "@/lib/collaboration/CollaborationContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useWorkspacePageHandlers } from "@/hooks/useWorkspacePageHandlers";
import type { MossNoteDockHandle } from "@/components/workspace/MossNoteDock";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspacePageContent } from "./WorkspacePageContent";

const DatabaseViewModal = dynamic(
  () =>
    import("@/components/database/DatabaseViewModal").then(
      (mod) => mod.DatabaseViewModal
    ),
  { ssr: false }
);

const GroveSideTab = dynamic(
  () =>
    import("@/components/workspace/GroveSideTab").then((mod) => mod.GroveSideTab),
  { ssr: false }
);

// env var는 개발 환경에서 전역 비활성화용으로만 사용 — 프로덕션에서는 페이지별 collaborationEnabled 필드로 제어
const COLLABORATION_GLOBALLY_DISABLED =
  process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === "false";

interface WorkspacePageProps {
  workspaceId: string;
  initialPages?: Page[];
}

interface WorkspacePageInnerProps {
  workspaceId: string;
  pageId: string;
}

// pageId는 URL search param에서 읽는다. server component(page.tsx)는 searchParams를
// 받지 않으므로 페이지 클릭 시 SSR이 재실행되지 않고, 본문 fetch만 클라이언트에서 일어난다.
export function WorkspacePage({ workspaceId, initialPages }: WorkspacePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPageId = searchParams.get("page");
  const setPages = usePageStore((state) => state.setPages);
  const storePages = usePageStore((state) => state.pages);

  // SSR로 받은 페이지 목록을 store에 한 번 주입 — 같은 워크스페이스 내에서는 layout의
  // fetchPages가 중복 호출되지 않는다 (initializedWorkspaceId 체크).
  useEffect(() => {
    if (initialPages) setPages(initialPages, workspaceId);
  }, [initialPages, workspaceId, setPages]);

  // pageId가 URL에 없으면 첫 페이지로 자동 이동.
  useEffect(() => {
    if (urlPageId) return;
    const fallbackId = initialPages?.[0]?.id ?? storePages[0]?.id;
    if (fallbackId) {
      router.replace(`/workspace/${workspaceId}?page=${fallbackId}`);
    }
  }, [urlPageId, initialPages, storePages, workspaceId, router]);

  if (!urlPageId) {
    const hasPages =
      (initialPages && initialPages.length > 0) || storePages.length > 0;
    if (hasPages) {
      // redirect가 commit되기 전까지의 짧은 빈 프레임
      return null;
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--color-background)] text-[var(--color-text-secondary)]">
        <span className="text-[15px]">페이지가 없습니다</span>
        <span className="text-[13px]">사이드바에서 새 페이지를 만들어 시작하세요</span>
      </div>
    );
  }

  return <WorkspacePageInner workspaceId={workspaceId} pageId={urlPageId} />;
}

function WorkspacePageInner({ workspaceId, pageId }: WorkspacePageInnerProps) {
  const {
    currentPage,
    fetchPage,
    setCurrentPage,
    getPageTrail,
    error,
  } = usePageStore();
  const isDatabaseModalOpen = useUIStore((state) => state.databaseModal.isOpen);
  const isGroveSideTabOpen = useUIStore((state) => state.groveSideTab.isOpen);
  const closeDatabaseModal = useUIStore((state) => state.closeDatabaseModal);
  const closeGroveSideTab = useUIStore((state) => state.closeGroveSideTab);

  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingChildType, setPendingChildType] = useState<PageType | null>(null);
  const [groveContentElement, setGroveContentElement] = useState<HTMLDivElement | null>(null);

  const editorInstanceRef = useRef<TiptapEditor | null>(null);
  const grovePageSurfaceRef = useRef<HTMLDivElement | null>(null);
  const mossNoteDockRef = useRef<MossNoteDockHandle | null>(null);
  const titleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 최신 editor content를 ref에 보관 — useAutoSave가 getContent()로 접근
  const latestContentRef = useRef<object>({ type: "doc", content: [{ type: "paragraph" }] });
  const handleEditorUpdate = useCallback((content: object) => {
    latestContentRef.current = content;
  }, []);

  const handleSpeechFinalResult = useCallback((text: string) => {
    editorInstanceRef.current?.chain().focus().insertContent(text).run();
  }, []);

  const {
    interimTranscript,
    isListening,
    isSupported: isSpeechSupported,
    start: startSpeech,
    stop: stopSpeech,
  } = useSpeechRecognition({ onFinalResult: handleSpeechFinalResult });

  const { scheduleSave, save } = useAutoSave({
    pageId,
    getContent: () => editorInstanceRef.current?.getJSON() ?? latestContentRef.current,
    debounceMs: 5000,
    intervalMs: 45000,
    onSaved: (content) => {
      setCurrentPage((page) => (page ? { ...page, content } : page));
    },
  });

  const handlers = useWorkspacePageHandlers({
    pageId,
    workspaceId,
    editorInstanceRef,
    groveContentElement,
    titleSaveTimerRef,
  });

  useEffect(() => {
    closeDatabaseModal();
    closeGroveSideTab();
  }, [closeDatabaseModal, closeGroveSideTab, pageId]);

  useEffect(() => {
    return () => {
      const titleSaveTimer = titleSaveTimerRef.current;
      if (titleSaveTimer) {
        clearTimeout(titleSaveTimer);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchPage(pageId).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [pageId, fetchPage]);

  const activePage = currentPage?.id === pageId ? currentPage : null;

  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title);
      latestContentRef.current =
        activePage.content ?? { type: "doc", content: [{ type: "paragraph" }] };
    }
  }, [activePage]);

  const pageTrail = useMemo(() => {
    if (!pageId) return [];
    const trail = getPageTrail(pageId);
    if (activePage) {
      return trail.map((page) => (page.id === activePage.id ? activePage : page));
    }
    return trail;
  }, [activePage, getPageTrail, pageId]);

  if (isLoading && !activePage) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!activePage) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-background)]">
        {error ?? "Page not found"}
      </div>
    );
  }

  const collabActive =
    !COLLABORATION_GLOBALLY_DISABLED && activePage.collaborationEnabled;

  return (
    <CollaborationProvider
      key={pageId}
      pageId={pageId}
      active={collabActive}
      pageType={activePage.type}
    >
      <WorkspacePageHeader
        pageTrail={pageTrail}
        activePage={activePage}
        workspaceId={workspaceId}
        pageId={pageId}
        collabActive={collabActive}
        onSaveRetry={() => void save()}
        onSelectPage={handlers.handleSelectPage}
        onHeadingFontSizesChange={handlers.handleHeadingFontSizesChange}
        onHighlightColorsChange={handlers.handleHighlightColorsChange}
        onCollaborationEnabledChange={handlers.handleCollaborationEnabledChange}
        onLineIndicatorEnabledChange={handlers.handleLineIndicatorEnabledChange}
        onExport={activePage.type === "document" ? handlers.handleExportPage : undefined}
      />

      <WorkspacePageContent
        activePage={activePage}
        pageId={pageId}
        workspaceId={workspaceId}
        title={title}
        isLoading={isLoading}
        pendingChildType={pendingChildType}
        grovePageSurfaceRef={grovePageSurfaceRef}
        mossNoteDockRef={mossNoteDockRef}
        groveContentElement={groveContentElement}
        interimTranscript={interimTranscript}
        isListening={isListening}
        isSpeechSupported={isSpeechSupported}
        scheduleSave={scheduleSave}
        onTitleChange={(newTitle) => {
          setTitle(newTitle);
          handlers.handleTitleChange(newTitle);
        }}
        onPageChromeUpdate={handlers.handlePageChromeUpdate}
        onCreateChildPage={(type) => {
          setPendingChildType(type);
          void handlers.handleCreateChildPage(type).then(() => setPendingChildType(null));
        }}
        onGroveContentReady={setGroveContentElement}
        onEditorReady={(editor) => { editorInstanceRef.current = editor; }}
        onEditorUpdate={handleEditorUpdate}
        onToggleSpeech={isListening ? stopSpeech : startSpeech}
      />

      {isDatabaseModalOpen && <DatabaseViewModal />}
      {isGroveSideTabOpen && <GroveSideTab workspaceId={workspaceId} />}
    </CollaborationProvider>
  );
}
