import type { SupabaseClient } from "@supabase/supabase-js";
import type { PresenceColor, User } from "@obnofi/types/clearing";
import type { PresenceUser } from "@/store/usePresenceStore";
import type { Point } from "@obnofi/types/clearing";
import type { CursorChatMessage } from "./timerUtils";

export function randomPresenceColor(): PresenceColor {
  const colors: PresenceColor[] = ["fern", "sky", "rose", "sun", "mist", "ink"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function randomPresenceName() {
  const names = ["Mina", "Theo", "Iris", "Jun", "Luca", "Nari", "Sora"];
  return names[Math.floor(Math.random() * names.length)];
}

export function createPresenceUser(user?: User | null): PresenceUser {
  return {
    id: user?.id ?? crypto.randomUUID(),
    name: user?.name ?? randomPresenceName(),
    color: user?.color ?? randomPresenceColor(),
    cursor: user?.cursor ?? null,
    selectedIds: [],
    lastActiveAt: Date.now(),
  };
}

export function normalizePresenceUser(record: Record<string, unknown>): User {
  const cursorRecord = record.cursor as Point | undefined;
  const cursorChatRecord = record.cursorChat as CursorChatMessage | null | undefined;

  return {
    id: String(record.id ?? crypto.randomUUID()),
    name: String(record.name ?? randomPresenceName()),
    email: (record.email as string | null) ?? null,
    avatarUrl: (record.avatarUrl as string | null) ?? null,
    color: (record.color as User["color"]) ?? randomPresenceColor(),
    cursor: cursorRecord
      ? { x: Number(cursorRecord.x), y: Number(cursorRecord.y) }
      : undefined,
    cursorChat: cursorChatRecord
      ? {
          message: String(cursorChatRecord.message ?? ""),
          createdAt: Number(cursorChatRecord.createdAt ?? Date.now()),
        }
      : null,
    connectedAt: String(record.connectedAt ?? new Date().toISOString()),
    lastSeenAt: String(record.lastSeenAt ?? new Date().toISOString()),
  };
}

export async function syncPresenceUserProfile(
  supabase: SupabaseClient,
  user: PresenceUser,
  email?: string | null,
  avatarUrl?: string | null
) {
  await supabase.from("users").upsert(
    {
      id: user.id,
      name: user.name,
      email,
      avatar_url: avatarUrl,
      color: user.color,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}
