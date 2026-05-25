"use client";

import { useEffect } from "react";
import { useJungleCursor } from "@/lib/cursor/jungleCursor";

export function JungleCursorSync() {
  const jungleCursor = useJungleCursor();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty("--obnofi-global-cursor", jungleCursor.cursorCss);
    root.dataset.jungleCursor = "active";
    body.dataset.jungleCursor = "active";

    return () => {
      root.style.removeProperty("--obnofi-global-cursor");
      delete root.dataset.jungleCursor;
      delete body.dataset.jungleCursor;
    };
  }, [jungleCursor.cursorCss]);

  return null;
}
