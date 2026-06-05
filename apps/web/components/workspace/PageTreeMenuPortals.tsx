"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  creatablePageTypes,
  creatablePageLabels,
} from "@/lib/pageCreation";
import { typeIcons } from "@/components/workspace/sidebarConstants";
import type { PageType } from "@obnofi/types";

// ── PageTreeMenuPortal ────────────────────────────────────────────────────────

interface PageTreeMenuPortalProps {
  position: { top: number; left: number };
  onDelete: () => void;
  onClose: () => void;
}

export function PageTreeMenuPortal({ position, onDelete, onClose }: PageTreeMenuPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const adjustedPosition = { ...position };
  if (typeof window !== "undefined") {
    const menuWidth = 140;
    const menuHeight = 120;
    if (position.left + menuWidth > window.innerWidth) {
      adjustedPosition.left = position.left - menuWidth - 24;
    }
    if (position.top + menuHeight > window.innerHeight) {
      adjustedPosition.top = window.innerHeight - menuHeight - 10;
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      data-page-tree-menu
      className="fixed rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg min-w-[120px]"
      style={{ top: adjustedPosition.top, left: adjustedPosition.left, zIndex: 99999 }}
    >
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        삭제
      </button>
    </div>,
    document.body
  );
}

// ── CreatePageMenuPortal ──────────────────────────────────────────────────────

interface CreatePageMenuPortalProps {
  position: { top: number; left: number };
  onCreate: (type: PageType) => void;
  onClose: () => void;
}

export function CreatePageMenuPortal({
  position,
  onCreate,
  onClose,
}: CreatePageMenuPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const adjustedPosition = { ...position };
  if (typeof window !== "undefined") {
    const menuWidth = 220;
    const menuHeight = 320;
    if (position.left + menuWidth > window.innerWidth) {
      adjustedPosition.left = window.innerWidth - menuWidth - 12;
    }
    if (position.top + menuHeight > window.innerHeight) {
      adjustedPosition.top = window.innerHeight - menuHeight - 12;
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      data-page-create-menu
      className="fixed min-w-[220px] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-lg"
      style={{ top: adjustedPosition.top, left: adjustedPosition.left, zIndex: 99999 }}
    >
      {creatablePageTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onCreate(type)}
          className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-hover)]"
        >
          <span className="mt-0.5 text-[var(--color-text-secondary)]">{typeIcons[type]}</span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-[var(--color-text-primary)]">
              {creatablePageLabels[type]}
            </span>
          </span>
        </button>
      ))}
    </div>,
    document.body
  );
}
