"use client";

import { useCollaborators } from "@/lib/collaboration/CollaborationContext";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";

const MAX_VISIBLE = 3;

export function CollaborationAvatars() {
  const collaborators = useCollaborators();
  const { awarenessCount } = useCollaboration();
  const remoteSessionCount = Math.max(0, awarenessCount - 1);

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const totalCount = Math.max(collaborators.length, remoteSessionCount);
  const overflow = Math.max(0, totalCount - MAX_VISIBLE);
  const leadNames = visible.map((user) => user.name).join(", ");
  const leadLabel = leadNames || "다른 세션";
  const summary =
    totalCount === 0
      ? "공동 편집 대기 중"
      : totalCount === 1
      ? `${leadLabel} 편집 중`
      : `${totalCount}명 편집 중`;
  const detail =
    totalCount === 0
      ? "다른 편집자가 아직 연결되지 않았습니다"
      : visible.length === 0
      ? `${totalCount}개 세션 연결됨`
      : totalCount <= MAX_VISIBLE
        ? leadNames
        : `${leadNames} 외 ${overflow}명`;

  return (
    <div
      className="flex items-center gap-2"
      data-testid="collaboration-status"
      data-awareness-count={awarenessCount}
      data-collaborator-count={collaborators.length}
      title={detail}
    >
      <div className="flex -space-x-1.5" data-testid="collaboration-avatars">
        {totalCount === 0 ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] ring-2 ring-[var(--color-background)] text-[10px] font-semibold text-[var(--color-text-secondary)]">
            ...
          </span>
        ) : null}
        {visible.map((user) => (
          <span
            key={user.clientId}
            className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[var(--color-background)] text-[10px] font-semibold text-white"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={user.name}
                className="h-full w-full object-cover"
                src={user.image}
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </span>
        ))}
        {overflow > 0 && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] ring-2 ring-[var(--color-background)] text-[10px] font-semibold text-[var(--color-text-secondary)]">
            +{overflow}
          </span>
        )}
      </div>
      <span
        className="text-xs text-[var(--color-text-secondary)]"
        data-testid="collaboration-status-text"
      >
        {summary}
      </span>
    </div>
  );
}
