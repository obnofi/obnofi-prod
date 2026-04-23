"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  type StickyNoteColor,
  type StickyNoteItem,
  useElementStore,
} from "@/store/useElementStore";

const STICKY_NOTE_COLORS: Record<
  StickyNoteColor,
  { surface: string; border: string; text: string; badge: string }
> = {
  yellow: {
    surface: "#FFF1A8",
    border: "#E8D56A",
    text: "#4D4113",
    badge: "#F3E17B",
  },
  pink: {
    surface: "#FFD9E6",
    border: "#F1ABC0",
    text: "#5B2A3C",
    badge: "#F8C3D5",
  },
  green: {
    surface: "#DDF2D8",
    border: "#A6D39A",
    text: "#1F4522",
    badge: "#CBE8C4",
  },
  blue: {
    surface: "#DDF1FF",
    border: "#A8CFE8",
    text: "#1C4660",
    badge: "#C8E5FA",
  },
  purple: {
    surface: "#E9DDFE",
    border: "#C9B1EF",
    text: "#43305F",
    badge: "#DCCDFA",
  },
  orange: {
    surface: "#FFE0C2",
    border: "#F0B984",
    text: "#5D3A15",
    badge: "#F9CFAB",
  },
  gray: {
    surface: "#ECECEC",
    border: "#CFCFCF",
    text: "#3C3C3C",
    badge: "#DADADA",
  },
  white: {
    surface: "#FFFFFF",
    border: "#D7D7D7",
    text: "#2F2F2F",
    badge: "#F3F3F3",
  },
};

const COLOR_ORDER: StickyNoteColor[] = [
  "yellow",
  "pink",
  "green",
  "blue",
  "purple",
  "orange",
  "gray",
  "white",
];

const MIN_STICKY_HEIGHT = 180;

async function persistStickyNote(
  stickyNote: StickyNoteItem,
  patch?: Partial<StickyNoteItem>
) {
  if (!stickyNote.roomId || !isSupabaseConfigured()) {
    return;
  }

  const nextStickyNote = {
    ...stickyNote,
    ...patch,
  };

  const supabase = createBrowserSupabaseClient();
  await supabase.from("elements").upsert(
    {
      id: nextStickyNote.id,
      room_id: nextStickyNote.roomId,
      type: "sticky",
      x: nextStickyNote.x,
      y: nextStickyNote.y,
      width: nextStickyNote.width,
      height: nextStickyNote.height,
      rotation: 0,
      z_index: 1,
      created_by: nextStickyNote.createdBy,
      style: {
        color: nextStickyNote.color,
        opacity: 1,
      },
      content: {
        kind: "sticky",
        text: nextStickyNote.content,
        tone: nextStickyNote.color,
      },
      created_at: nextStickyNote.createdAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

async function removeStickyNoteFromSupabase(stickyNote: StickyNoteItem) {
  if (!stickyNote.roomId || !isSupabaseConfigured()) {
    return;
  }

  const supabase = createBrowserSupabaseClient();
  await supabase.from("elements").delete().eq("id", stickyNote.id);
}

export function StickyNote({
  stickyNote,
  scale = 1,
}: {
  stickyNote: StickyNoteItem;
  scale?: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const draftRef = useRef(stickyNote.content);
  const [isEditing, setIsEditing] = useState(false);
  const { updateStickyNote, moveStickyNote, resizeStickyNote, deleteStickyNote } =
    useElementStore();

  const colorToken = useMemo(
    () => STICKY_NOTE_COLORS[stickyNote.color],
    [stickyNote.color]
  );

  useEffect(() => {
    if (!isEditing) {
      draftRef.current = stickyNote.content;
    }
  }, [stickyNote.content, isEditing]);

  useEffect(() => {
    if (!isEditing || !contentRef.current) {
      return;
    }

    contentRef.current.focus();
    document.getSelection()?.selectAllChildren(contentRef.current);
    document.getSelection()?.collapseToEnd();
  }, [isEditing]);

  const syncHeight = () => {
    if (!contentRef.current) {
      return;
    }

    contentRef.current.style.height = "0px";
    const nextHeight = Math.max(
      MIN_STICKY_HEIGHT,
      contentRef.current.scrollHeight + 58
    );
    contentRef.current.style.height = "auto";

    if (nextHeight !== stickyNote.height) {
      resizeStickyNote(stickyNote.id, nextHeight);
      void persistStickyNote(stickyNote, { height: nextHeight });
    }
  };

  const commitContent = () => {
    const normalizedContent = draftRef.current.trimEnd();
    if (normalizedContent !== stickyNote.content) {
      updateStickyNote(stickyNote.id, { content: normalizedContent });
      void persistStickyNote(stickyNote, {
        content: normalizedContent,
        height: stickyNote.height,
      });
    }
    setIsEditing(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing || event.button !== 0) {
      return;
    }

    event.stopPropagation();
    const currentTargetRect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: (event.clientX - currentTargetRect.left) / scale,
      offsetY: (event.clientY - currentTargetRect.top) / scale,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    const parentRect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!parentRect) {
      return;
    }

    const nextX = (event.clientX - parentRect.left) / scale - dragState.offsetX;
    const nextY = (event.clientY - parentRect.top) / scale - dragState.offsetY;
    moveStickyNote(stickyNote.id, nextX, nextY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    void persistStickyNote(stickyNote);
  };

  return (
    <div
      className="group absolute select-none"
      style={{
        left: stickyNote.x,
        top: stickyNote.y,
        width: stickyNote.width,
        height: stickyNote.height,
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="relative rounded-[22px] border p-4 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-transform duration-150 group-hover:-translate-y-0.5"
        style={{
          backgroundColor: colorToken.surface,
          borderColor: colorToken.border,
          color: colorToken.text,
          minHeight: stickyNote.height,
        }}
      >
        <button
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition hover:scale-105 group-hover:opacity-100"
          style={{
            backgroundColor: colorToken.badge,
          }}
          type="button"
          onClick={() => {
            deleteStickyNote(stickyNote.id);
            void removeStickyNoteFromSupabase(stickyNote);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="mb-4 flex flex-wrap gap-1 pr-10">
          {COLOR_ORDER.map((color) => (
            <button
              key={color}
              aria-label={`Set sticky color to ${color}`}
              className={`h-4 w-4 rounded-full border transition ${
                stickyNote.color === color ? "scale-110 ring-2 ring-offset-1" : ""
              }`}
              style={{
                backgroundColor: STICKY_NOTE_COLORS[color].surface,
                borderColor: STICKY_NOTE_COLORS[color].border,
                boxShadow:
                  stickyNote.color === color
                    ? `0 0 0 2px ${colorToken.border}`
                    : undefined,
              }}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                updateStickyNote(stickyNote.id, { color });
                void persistStickyNote(stickyNote, { color });
              }}
            />
          ))}
        </div>

        <div
          ref={contentRef}
          className="min-h-[120px] whitespace-pre-wrap break-words bg-transparent text-base font-medium leading-7 outline-none"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={commitContent}
          onInput={(event) => {
            draftRef.current = event.currentTarget.textContent ?? "";
            syncHeight();
          }}
          onPointerDown={(event) => {
            if (isEditing) {
              event.stopPropagation();
            }
          }}
        >
          {stickyNote.content}
        </div>
      </div>
    </div>
  );
}
