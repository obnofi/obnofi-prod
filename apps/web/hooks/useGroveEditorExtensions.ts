import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { GroveCollaborationCursor } from "@/components/editor/extensions/GroveCollaborationCursor";
import { PersistentCursorPresenceExtension } from "@/components/editor/extensions/PersistentCursorPresenceExtension";
import { LinePresenceExtension } from "@/components/editor/extensions/LinePresenceExtension";
import { DatabaseBlock } from "@/components/editor/extensions/DatabaseBlock";
import { CanvasBlock } from "@/components/editor/extensions/CanvasBlock";
import { ButtonBlock } from "@/components/editor/extensions/ButtonBlock";
import { CodeBlock } from "@/components/editor/extensions/CodeBlock";
import {
  ColumnLayoutBlock,
  GroveColumn,
} from "@/components/editor/extensions/ColumnLayoutBlock";
import { LinkedDatabaseBlock } from "@/components/editor/extensions/LinkedDatabaseBlock";
import { MathBlock } from "@/components/editor/extensions/MathBlock";
import { SlashCommandExtension } from "@/components/editor/extensions/SlashCommandExtension";
import {
  CustomEmojiNode,
  PersonalEmojiExtension,
} from "@/components/editor/extensions/PersonalEmojiExtension";
import { PageLinkExtension } from "@/components/editor/extensions/PageLinkExtension";
import { PageLinkMark } from "@/components/editor/extensions/PageMentionExtension";
import { DbDiagramExtension } from "@/src/components/editor/extensions/DbDiagramExtension";
import { SubPageBlock } from "@/components/editor/extensions/SubPageBlock";
import { BlockActionsExtension } from "@/components/editor/extensions/BlockActionsExtension";
import { TextHighlightMark } from "@/components/editor/extensions/TextHighlightMark";
import { TaskItem, TaskList } from "@/components/editor/extensions/TaskList";
import {
  FileDropBlock,
  GroveImageBlock,
  GitHubEmbedBlock,
  GroveTableBlock,
  LinkEmbedBlock,
  WebClipBlock,
} from "@/components/editor/extensions/GroveInsertionBlocks";
import { useJungleCursor } from "@/lib/cursor/jungleCursor";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

interface UseGroveEditorExtensionsOptions {
  ydoc: Y.Doc | null | undefined;
  provider: WebsocketProvider | null | undefined;
  lineIndicatorEnabled: boolean;
  editable: boolean;
  placeholder: string;
  workspaceId?: string;
  pageId?: string;
  sessionUserName?: string;
  sessionUserEmail?: string;
  sessionUserImage?: string | null;
  userColor: (email: string) => string;
  onLinkDatabase: () => void;
  onInsertButton: () => void;
  onInsertPageLink: () => void;
}

export function useGroveEditorExtensions({
  ydoc,
  provider,
  lineIndicatorEnabled,
  editable,
  placeholder,
  workspaceId,
  pageId,
  sessionUserName,
  sessionUserEmail,
  sessionUserImage,
  userColor,
  onLinkDatabase,
  onInsertButton,
  onInsertPageLink,
}: UseGroveEditorExtensionsOptions) {
  const jungleCursor = useJungleCursor();

  return [
    StarterKit.configure(ydoc ? { undoRedo: false } : {}),
    Placeholder.configure({ placeholder }),
    TextHighlightMark,
    TaskList,
    TaskItem,
    ...(ydoc && provider
      ? [
          Collaboration.configure({ document: ydoc }),
          GroveCollaborationCursor.configure({
            awareness: provider.awareness,
            user: {
              name: sessionUserName ?? "Anonymous",
              color: jungleCursor.color ?? userColor(sessionUserEmail ?? ""),
              image: sessionUserImage ?? null,
              cursorColorKey: jungleCursor.colorKey,
              cursorVariant: jungleCursor.variant,
            },
          }),
          PersistentCursorPresenceExtension.configure({
            awareness: provider.awareness,
          }),
          ...(lineIndicatorEnabled
            ? [
                LinePresenceExtension.configure({
                  awareness: provider.awareness,
                  localClientId: provider.awareness.clientID,
                }),
              ]
            : []),
        ]
      : []),
    DatabaseBlock.configure({ workspaceId, pageId }),
    CanvasBlock.configure({ workspaceId, pageId }),
    ButtonBlock,
    CodeBlock,
    GroveColumn,
    ColumnLayoutBlock,
    MathBlock,
    LinkedDatabaseBlock.configure({ workspaceId, pageId }),
    GroveTableBlock,
    GroveImageBlock.configure({ pageId }),
    FileDropBlock,
    LinkEmbedBlock,
    GitHubEmbedBlock,
    WebClipBlock,
    CustomEmojiNode,
    PersonalEmojiExtension,
    DbDiagramExtension.configure({ workspaceId, pageId }),
    PageLinkExtension,
    PageLinkMark.configure({ workspaceId }),
    SubPageBlock,
    ...(editable ? [BlockActionsExtension] : []),
    SlashCommandExtension.configure({
      workspaceId,
      pageId,
      onLinkDatabase,
      onInsertButton,
      onInsertPageLink: onInsertPageLink,
    }),
  ];
}
