"use client";

import { useState, useRef } from "react";
import { User, X } from "lucide-react";
import { DropdownPortal } from "@/components/database/DropdownPortal";

interface UserData {
  id: string;
  name: string;
  avatar?: string;
}

interface PersonCellProps {
  value: string | null;
  users?: UserData[];
  onChange: (userId: string | null) => void;
}

export function PersonCell({ value, users = [], onChange }: PersonCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedUser = users.find((u) => u.id === value);

  const getInitials = (name: string): string =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center gap-1 rounded border border-transparent px-2 py-1.5 text-left text-sm transition hover:bg-[var(--color-hover)]"
      >
        {selectedUser ? (
          <div className="flex items-center gap-1.5">
            {selectedUser.avatar ? (
              <img src={selectedUser.avatar} alt={selectedUser.name} className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-selected)] text-xs font-medium text-[var(--color-text-primary)]">
                {getInitials(selectedUser.name)}
              </div>
            )}
            <span className="text-[var(--color-text-primary)]">{selectedUser.name}</span>
            <span
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="ml-1 cursor-pointer rounded p-0.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
            >
              <X className="h-3 w-3" />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <User className="h-4 w-4" />
            <span>Empty</span>
          </div>
        )}
      </button>

      <DropdownPortal triggerRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="min-w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          {users.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">No users available</div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { onChange(null); setIsOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              >
                <User className="h-4 w-4" />
                Empty
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => { onChange(user.id); setIsOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-hover)]"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-selected)] text-xs font-medium text-[var(--color-text-primary)]">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="text-[var(--color-text-primary)]">{user.name}</span>
                  {value === user.id && <span className="ml-auto text-[var(--color-accent)]">✓</span>}
                </button>
              ))}
            </>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
}
