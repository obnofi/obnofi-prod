"use client";

import {
  getJungleCursorAssetPath,
  resolveJungleCursorColor,
  getJungleCursorRenderMetrics,
  type JungleCursorColorKey,
  type JungleCursorVariant,
} from "@/lib/cursor/jungleCursor";

interface JungleRemoteCursorProps {
  color: string;
  colorKey?: JungleCursorColorKey;
  cursorChatMessage?: string | null;
  isFadingOut?: boolean;
  userId: string;
  userName?: string;
  variant?: JungleCursorVariant;
  x: number;
  y: number;
}

export function JungleRemoteCursor({
  color,
  colorKey = "green",
  cursorChatMessage,
  isFadingOut = false,
  userId,
  userName,
  variant = "pointing",
  x,
  y,
}: JungleRemoteCursorProps) {
  const metrics = getJungleCursorRenderMetrics(variant);
  const displayColor = resolveJungleCursorColor(colorKey, color);
  const shouldShowName = !cursorChatMessage;

  return (
    <div
      data-user-cursor={userId}
      className={`pointer-events-none absolute z-[10010] transition-opacity duration-200 ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        left: x - metrics.hotspotX,
        top: y - metrics.hotspotY,
      }}
    >
      {cursorChatMessage ? (
        <div
          className="mb-1 max-w-56 rounded-2xl px-3 py-2 text-xs font-medium text-white shadow-lg"
          style={{ backgroundColor: displayColor }}
        >
          {cursorChatMessage}
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        className="block select-none"
        src={getJungleCursorAssetPath(variant, colorKey)}
        style={{ width: metrics.width, height: metrics.height }}
      />
      {shouldShowName ? (
        <span
          className="mt-1 inline-flex max-w-[180px] rounded-[9px] border border-white px-2 py-1 text-[11px] font-bold leading-none text-white shadow-sm"
          style={{ backgroundColor: displayColor }}
        >
          {userName}
        </span>
      ) : null}
    </div>
  );
}
