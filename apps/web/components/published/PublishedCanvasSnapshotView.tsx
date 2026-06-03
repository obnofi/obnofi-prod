"use client";

import { useMemo } from "react";
import { catmullRomToBezierPath } from "@/lib/pathUtils";
import { normalizeLegacyContent, renderShape } from "@/lib/canvas/canvasUtils";

interface PublishedCanvasSnapshotViewProps {
  content: object | null;
}

export function PublishedCanvasSnapshotView({
  content,
}: PublishedCanvasSnapshotViewProps) {
  const document = useMemo(() => normalizeLegacyContent(content), [content]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--color-surface)]" style={{ minHeight: 520 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(46,125,69,0.16) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <svg viewBox="0 0 1200 800" className="relative h-full min-h-[520px] w-full">
        {document.layers.map((layer) =>
          layer.kind === "stroke" ? (
            <path
              key={layer.id}
              d={catmullRomToBezierPath(layer.points)}
              fill="none"
              stroke={layer.color}
              strokeWidth={layer.size}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            renderShape(layer)
          )
        )}
      </svg>
    </div>
  );
}
