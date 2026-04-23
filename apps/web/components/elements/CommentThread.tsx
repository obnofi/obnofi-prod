"use client";

import { useMemo, useState } from "react";
import type { Comment } from "@obnofi/types/clearing";

export function CommentThread({
  comments,
  onClose,
  onReply,
  onResolve,
  x,
  y,
}: {
  comments: Comment[];
  onClose: () => void;
  onReply: (content: string, parentId?: string | null) => void;
  onResolve: () => void;
  x: number;
  y: number;
}) {
  const [draft, setDraft] = useState("");
  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parentId),
    [comments]
  );

  return (
    <div
      className="fixed z-50 w-[360px] rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Thread</p>
        <button
          className="rounded-lg px-2 py-1 text-xs hover:bg-[var(--color-hover)]"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="mt-3 max-h-[280px] space-y-3 overflow-auto">
        {rootComments.map((comment) => {
          const replies = comments.filter((reply) => reply.parentId === comment.id);
          return (
            <div
              key={comment.id}
              className={`rounded-2xl border p-3 ${comment.resolved ? "bg-zinc-100 text-zinc-500" : "bg-[var(--color-background)]"}`}
            >
              <p className="text-sm">{comment.content ?? comment.body}</p>
              {replies.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3">
                  {replies.map((reply) => (
                    <div key={reply.id} className="rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm">
                      {reply.content ?? reply.body}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-hover)]"
                  type="button"
                  onClick={() => {
                    if (draft.trim()) {
                      onReply(draft.trim(), comment.id);
                      setDraft("");
                    }
                  }}
                >
                  Reply
                </button>
                {!comment.resolved ? (
                  <button
                    className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-hover)]"
                    type="button"
                    onClick={onResolve}
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <textarea
        className="mt-4 h-24 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none"
        placeholder="Write a comment"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white"
          type="button"
          onClick={() => {
            if (draft.trim()) {
              onReply(draft.trim(), null);
              setDraft("");
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
