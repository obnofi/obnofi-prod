import type {
  JungleCursorColorKey,
  JungleCursorVariant,
} from "@/lib/cursor/jungleCursor";

export interface UserCursor {
  type: "page" | "canvas" | "database";
  pageId: string;
  canvasPosition: { x: number; y: number } | null;
  databaseCell: { rowId: string; colId: string } | null;
}

export interface AwarenessState {
  userId: string;
  userName: string;
  color: string;
  cursorColorKey?: JungleCursorColorKey;
  cursorVariant?: JungleCursorVariant;
  hasTextCursor?: boolean;
  userCursor: UserCursor | null;
}
