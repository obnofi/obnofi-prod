export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

export type CanvasPoint = {
  x: number;
  y: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export type CoordinateBounds = {
  minScale?: number;
  maxScale?: number;
};

export function clampScale(
  scale: number,
  bounds: CoordinateBounds = {}
) {
  const minScale = bounds.minScale ?? 0.1;
  const maxScale = bounds.maxScale ?? 5;
  return Math.min(maxScale, Math.max(minScale, scale));
}

export function screenToCanvas(
  x: number,
  y: number,
  viewport: ViewportState,
  rect?: Pick<DOMRect, "left" | "top">
): CanvasPoint {
  const offsetLeft = rect?.left ?? 0;
  const offsetTop = rect?.top ?? 0;

  return {
    x: (x - offsetLeft - viewport.x) / viewport.scale,
    y: (y - offsetTop - viewport.y) / viewport.scale,
  };
}

export function canvasToScreen(
  x: number,
  y: number,
  viewport: ViewportState,
  rect?: Pick<DOMRect, "left" | "top">
): ScreenPoint {
  const offsetLeft = rect?.left ?? 0;
  const offsetTop = rect?.top ?? 0;

  return {
    x: offsetLeft + viewport.x + x * viewport.scale,
    y: offsetTop + viewport.y + y * viewport.scale,
  };
}
