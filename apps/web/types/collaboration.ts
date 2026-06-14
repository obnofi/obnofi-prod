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

export interface CursorChatState {
  text: string;
  status: "drafting" | "sent";
  expiresAt: number | null;
  updatedAt: number;
}

// Firefly — 레이저 포인터. trail 좌표는 scene(캔버스) 좌표계.
export interface LaserPointerState {
  points: { x: number; y: number }[];
  color: string;
  expiresAt: number;
  updatedAt: number;
}

export interface AwarenessState {
  userId: string;
  userName: string;
  color: string;
  cursorColorKey?: JungleCursorColorKey;
  cursorVariant?: JungleCursorVariant;
  hasTextCursor?: boolean;
  userCursor: UserCursor | null;
  slashCommand?: { query: string } | null;
  cursorChat?: CursorChatState | null;
  laser?: LaserPointerState | null;
}
