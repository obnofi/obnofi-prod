"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, Pin, PinOff, Target } from "lucide-react";

export interface GraphContextMenuState {
  nodeId: string;
  pageId: string | null;
  label: string;
  x: number;
  y: number;
}

interface GraphContextMenuProps {
  menu: GraphContextMenuState;
  isPinned: boolean;
  onOpenPage: (pageId: string) => void;
  onFocusLocal: (nodeId: string) => void;
  onTogglePin: (nodeId: string) => void;
  onClose: () => void;
}

export function GraphContextMenu({
  menu,
  isPinned,
  onOpenPage,
  onFocusLocal,
  onTogglePin,
  onClose,
}: GraphContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-[10001] min-w-[180px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-xs shadow-lg"
      style={{ left: menu.x, top: menu.y }}
    >
      <div className="truncate border-b border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-primary)]">
        {menu.label}
      </div>
      <MenuButton
        icon={<ExternalLink className="h-3.5 w-3.5" />}
        label="페이지 열기"
        disabled={!menu.pageId}
        onClick={() => {
          if (menu.pageId) onOpenPage(menu.pageId);
          onClose();
        }}
      />
      <MenuButton
        icon={<Target className="h-3.5 w-3.5" />}
        label="로컬 그래프로 보기"
        onClick={() => {
          onFocusLocal(menu.nodeId);
          onClose();
        }}
      />
      <MenuButton
        icon={
          isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />
        }
        label={isPinned ? "고정 해제" : "고정"}
        onClick={() => {
          onTogglePin(menu.nodeId);
          onClose();
        }}
      />
    </div>
  );
}

function MenuButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}
