"use client";

export function VoteBadge({
  count,
  onVote,
  visible,
}: {
  count: number;
  onVote: () => void;
  visible: boolean;
}) {
  return (
    <div className={`absolute -bottom-3 -right-3 z-20 flex items-center gap-2 ${visible ? "opacity-100" : "opacity-0"} transition`}>
      <button
        className="flex h-8 min-w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-semibold shadow-sm hover:bg-[var(--color-hover)]"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onVote();
        }}
      >
        •
      </button>
      {count > 0 ? (
        <span className="rounded-full bg-[var(--color-text-primary)] px-2 py-1 text-[10px] font-semibold text-[var(--color-background)]">
          {count}
        </span>
      ) : null}
    </div>
  );
}
