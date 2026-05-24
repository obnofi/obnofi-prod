import type { Element } from "@obnofi/types/clearing";

export const PALETTE = {
  ink: "var(--color-text-primary)",
  fern: "var(--color-accent)",
  mist: "var(--color-board-card)",
  sun: "var(--color-sticky-sun)",
  rose: "var(--color-sticky-rose)",
  sky: "var(--color-sticky-sky)",
};

export function resolveColor(color: string) {
  if (color in PALETTE) {
    return PALETTE[color as keyof typeof PALETTE];
  }
  return color;
}

export function getConnectorPoints(element: Element, linkedElements: Record<string, Element>) {
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
