"use client";

import { catmullRomToBezierPath } from "@/lib/pathUtils";
import { EmbedElement } from "@/components/elements/EmbedElement";
import { ImageElement } from "@/components/elements/ImageElement";
import { SectionTool } from "@/components/elements/SectionTool";
import { ShapeTool } from "@/components/elements/ShapeTool";
import { StickyTool } from "@/components/elements/StickyTool";
import { TextTool } from "@/components/elements/TextTool";
import { VoteBadge } from "@/components/elements/VoteBadge";
import type { Element, StickyElement } from "@/types/clearing";
import { useElementStore } from "@/store/useElementStore";

const PALETTE = {
  ink: "var(--color-text-primary)",
  fern: "var(--color-accent)",
  mist: "var(--color-board-card)",
  sun: "var(--color-sticky-sun)",
  rose: "var(--color-sticky-rose)",
  sky: "var(--color-sticky-sky)",
};

function resolveColor(color: string) {
  if (color in PALETTE) {
    return PALETTE[color as keyof typeof PALETTE];
  }
  return color;
}

function getConnectorPoints(element: Element, linkedElements: Record<string, Element>) {
  if (element.type !== "connector") {
    return null;
  }

  const fromElement =
    element.content.fromElementId ? linkedElements[element.content.fromElementId] : undefined;
  const toElement =
    element.content.toElementId ? linkedElements[element.content.toElementId] : undefined;

  const start = fromElement
    ? { x: fromElement.x + fromElement.width / 2, y: fromElement.y + fromElement.height / 2 }
    : element.content.start;
  const end = toElement
    ? { x: toElement.x + toElement.width / 2, y: toElement.y + toElement.height / 2 }
    : element.content.end;

  const padding = 18;
  const minX = Math.min(start.x, end.x) - padding;
  const minY = Math.min(start.y, end.y) - padding;
  const width = (Math.abs(end.x - start.x) || 2) + padding * 2;
  const height = (Math.abs(end.y - start.y) || 2) + padding * 2;

  return {
    x: minX,
    y: minY,
    width,
    height,
    startX: start.x - minX,
    startY: start.y - minY,
    endX: end.x - minX,
    endY: end.y - minY,
  };
}

export function BoardElementRenderer({
  element,
  isSelected,
  linkedElements,
  commentCount,
  onPointerDown,
  onVote,
  scale,
  containingSectionId,
  isSectionSelected,
}: {
  element: Element;
  isSelected: boolean;
  linkedElements: Record<string, Element>;
  commentCount: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
  onVote: (elementId: string) => void;
  scale: number;
  containingSectionId?: string | null;
  isSectionSelected?: boolean;
}) {
  const { updateElement } = useElementStore();
  if (element.type === "connector") {
    const points = getConnectorPoints(element, linkedElements);
    if (!points) {
      return null;
    }

    return (
      <div
        className="pointer-events-auto absolute"
        style={{
          left: points.x,
          top: points.y,
          width: points.width,
          height: points.height,
        }}
        onPointerDown={(event) => onPointerDown(event, element.id)}
      >
        {/* Invisible hit area for easier selection - always transparent */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={{
            background: "transparent",
          }}
        />
        <svg className="overflow-visible pointer-events-none" height={points.height} width={points.width}>
          <defs>
            <marker
              id={`arrow-end-${element.id}`}
              markerHeight="8"
              markerWidth="8"
              orient="auto"
              refX="7"
              refY="4"
              viewBox="0 0 8 8"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill={resolveColor(element.style.color)} />
            </marker>
            <marker
              id={`arrow-start-${element.id}`}
              markerHeight="8"
              markerWidth="8"
              orient="auto-start-reverse"
              refX="1"
              refY="4"
              viewBox="0 0 8 8"
            >
              <path d="M 8 0 L 0 4 L 8 8 z" fill={resolveColor(element.style.color)} />
            </marker>
          </defs>
          <line
            x1={points.startX}
            x2={points.endX}
            y1={points.startY}
            y2={points.endY}
            stroke={resolveColor(element.style.color)}
            strokeWidth={(element.style.strokeWidth ?? 3) + (isSelected ? 2 : 0)}
            strokeLinecap="round"
            strokeDasharray={
              element.content.lineStyle === "dashed"
                ? "8 4"
                : element.content.lineStyle === "dotted"
                  ? "2 4"
                  : undefined
            }
            markerEnd={element.content.arrowEnd ? `url(#arrow-end-${element.id})` : undefined}
            markerStart={element.content.arrowStart ? `url(#arrow-start-${element.id})` : undefined}
          />
          {isSelected && (
            <>
              {/* Start point indicator */}
              <circle
                cx={points.startX}
                cy={points.startY}
                r={6}
                fill="var(--color-accent)"
                stroke="white"
                strokeWidth={2}
              />
              {/* End point indicator */}
              <circle
                cx={points.endX}
                cy={points.endY}
                r={6}
                fill="var(--color-accent)"
                stroke="white"
                strokeWidth={2}
              />
            </>
          )}
          {element.content.label ? (
            <text
              fill="var(--color-text-secondary)"
              fontFamily="var(--font-sans)"
              fontSize="12"
              x={(points.startX + points.endX) / 2 + 8}
              y={(points.startY + points.endY) / 2 - 8}
            >
              {element.content.label}
            </text>
          ) : null}
        </svg>
      </div>
    );
  }

  // Check if element is inside a section that is being dragged
  const isInsideSelectedSection = isSectionSelected && containingSectionId && !isSelected;

  const sharedProps = {
    className: `pointer-events-auto group absolute cursor-grab active:cursor-grabbing ${
      isInsideSelectedSection ? "ring-2 ring-[var(--color-accent)]/50 ring-offset-2" : ""
    }`,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => onPointerDown(event, element.id),
    style: {
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      zIndex: element.zIndex,
      transform: `rotate(${element.rotation}deg)`,
      opacity: element.style.opacity,
    },
  } satisfies React.HTMLAttributes<HTMLDivElement>;

  return (
    <div {...sharedProps}>
      {element.type === "sticky" ? (
        <StickyTool
          element={element as StickyElement}
          isSelected={isSelected}
          onVote={onVote}
          scale={scale}
        />
      ) : null}

      {element.type === "section" ? (
        <SectionTool
          element={element}
          isSelected={isSelected}
          onPointerDown={onPointerDown}
          onResize={(elementId, updates) => {
            updateElement(elementId, {
              ...updates,
              updatedAt: new Date().toISOString(),
            });
          }}
        />
      ) : null}

      {element.type === "shape" ? (
        <div className="relative h-full w-full">
          <ShapeTool
            element={element}
            isSelected={isSelected}
            onPointerDown={onPointerDown}
            scale={scale}
          />
          <VoteBadge
            count={Object.values(element.content.votes ?? {}).reduce((sum, value) => sum + value, 0)}
            onVote={() => onVote(element.id)}
            visible={isSelected}
          />
        </div>
      ) : null}

      {element.type === "text" ? (
        <TextTool
          autoEdit={element.content.text.length === 0}
          element={element}
          isSelected={isSelected}
          onPointerDown={onPointerDown}
        />
      ) : null}

      {element.type === "image" ? (
        <ImageElement
          element={element}
          isSelected={isSelected}
          onPointerDown={onPointerDown}
          scale={scale}
        />
      ) : null}

      {element.type === "embed" ? (
        <EmbedElement
          element={element}
          isSelected={isSelected}
          onPointerDown={onPointerDown}
        />
      ) : null}

      {element.type === "path" ? (
        <div className={`${isSelected ? "ring-2 ring-[var(--color-accent)]" : ""} rounded-2xl`}>
          <svg className="overflow-visible" height={element.height} width={element.width}>
            <path
              d={catmullRomToBezierPath(element.content.points)}
              fill="none"
              stroke={resolveColor(element.style.color)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={element.style.strokeWidth ?? 4}
            />
          </svg>
        </div>
      ) : null}

      {commentCount > 0 ? (
        <div className="absolute -right-3 -top-3 flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-2 text-xs font-semibold text-[var(--color-background)] shadow-sm">
          {commentCount}
        </div>
      ) : null}
    </div>
  );
}
