"use client";

import { useCollaborators } from "@/lib/collaboration/CollaborationContext";

const MAX_VISIBLE = 3;

export function CollaborationAvatars() {
  const collaborators = useCollaborators();

  if (collaborators.length === 0) return null;

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - MAX_VISIBLE;

  return (
    <div className="flex items-center" title={`${collaborators.length}명이 편집 중`}>
      <div className="flex -space-x-1.5">
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
    </div>
  );
}
