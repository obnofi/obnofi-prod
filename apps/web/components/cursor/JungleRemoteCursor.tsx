"use client";

import {
  getJungleCursorAssetPath,
  getJungleCursorRenderMetrics,
  type JungleCursorColorKey,
  type JungleCursorVariant,
} from "@/lib/cursor/jungleCursor";

interface JungleRemoteCursorProps {
  color: string;
  colorKey?: JungleCursorColorKey;
  userId: string;
  userName?: string;
  variant?: JungleCursorVariant;
  x: number;
  y: number;
}

export function JungleRemoteCursor({
  color,
  colorKey = "green",
  userId,
  userName,
  variant = "pointing",
  x,
  y,
}: JungleRemoteCursorProps) {
  const metrics = getJungleCursorRenderMetrics(variant);

  return (
    <div
      data-user-cursor={userId}
      className="pointer-events-none absolute z-40"
      style={{
        left: x - metrics.hotspotX,
        top: y - metrics.hotspotY,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        className="block select-none"
        src={getJungleCursorAssetPath(variant, colorKey)}
        style={{ width: metrics.width, height: metrics.height }}
      />
      <span
        className="mt-1 inline-flex max-w-[180px] rounded-[9px] border border-white px-2 py-1 text-[11px] font-bold leading-none text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {userName}
      </span>
    </div>
  );
}
