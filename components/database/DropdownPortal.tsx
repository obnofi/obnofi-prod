"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  triggerRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  align?: "left" | "right";
  children: React.ReactNode;
}

export function DropdownPortal({
  triggerRef,
  isOpen,
  onClose,
  align = "left",
  children,
}: DropdownPortalProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: align === "right" ? rect.right : rect.left,
    });
  }, [isOpen, triggerRef, align]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!mounted || !isOpen) return null;

  const style: React.CSSProperties =
    align === "right"
      ? { position: "fixed", top: coords.top, right: window.innerWidth - coords.left, zIndex: 99999 }
      : { position: "fixed", top: coords.top, left: coords.left, zIndex: 99999 };

  return createPortal(
    <div style={style}>{children}</div>,
    document.body
  );
}
