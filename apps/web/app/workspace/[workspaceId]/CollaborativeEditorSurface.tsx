"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { Page } from "@obnofi/types";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import type { MossNoteDockHandle } from "@/components/workspace/MossNoteDock";
import type { RefObject } from "react";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

const Editor = dynamic(
  () => import("@/components/editor/Editor").then((mod) => mod.Editor),
  {
    loading: () => (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
      </div>
    ),
    ssr: false,
  }
);

export interface CollaborativeEditorSurfaceProps {
  pageId: string;
  workspaceId: string;
  content: object | null;
  bodyFontSizePt: number;
  headingFontSizes: Page["headingFontSizes"];
  highlightColors: Page["highlightColors"];
  pageUpdatedAt: string;
  yjsUpdatedAt: string | null;
  lineIndicatorEnabled: boolean;
  onUpdate: (content: object) => void;
  onEdit: () => void;
  onContentContainerReady: (node: HTMLDivElement | null) => void;
  onEditorReady: (editor: TiptapEditor | null) => void;
  interimTranscript: string;
  isSpeechListening: boolean;
  speechListeningState: ParrotListeningState;
  mossNoteDockRef: RefObject<MossNoteDockHandle | null>;
  mossNoteSurfaceRef: RefObject<HTMLDivElement | null>;
}

export function CollaborativeEditorSurface(props: CollaborativeEditorSurfaceProps) {
  const { ydoc, provider, localUserId } = useCollaboration();
  const editorModeKey =
    ydoc && provider ? `collab:${localUserId ?? "anonymous"}` : "local";

  return (
    <Editor
      key={`${props.pageId}:${editorModeKey}`}
      content={props.content}
      bodyFontSizePt={props.bodyFontSizePt}
      headingFontSizes={props.headingFontSizes}
      highlightColors={props.highlightColors}
      pageUpdatedAt={props.pageUpdatedAt}
      yjsUpdatedAt={props.yjsUpdatedAt}
      editable={true}
      onUpdate={props.onUpdate}
      onEdit={props.onEdit}
      placeholder="Type something..."
      workspaceId={props.workspaceId}
      pageId={props.pageId}
      lineIndicatorEnabled={props.lineIndicatorEnabled}
      onContentContainerReady={props.onContentContainerReady}
      onEditorReady={props.onEditorReady}
      interimTranscript={props.interimTranscript}
      isSpeechListening={props.isSpeechListening}
      speechListeningState={props.speechListeningState}
      mossNoteDockRef={props.mossNoteDockRef}
      mossNoteSurfaceRef={props.mossNoteSurfaceRef}
    />
  );
}
