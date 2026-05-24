import type { Point, CanvasLayer, StrokeLayer, ShapeLayer, CanvasDocument } from "./canvasTypes";

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
    )
  );
  const projectionX = start.x + t * dx;
  const projectionY = start.y + t * dy;

  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

export function getPointFromEvent(
  event: React.PointerEvent<HTMLDivElement>,
  element: HTMLDivElement | null
) {
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function normalizeLegacyContent(content: object | null): CanvasDocument {
  if (!content) {
    return { version: 2, layers: [] };
  }

  const maybeCanvas = content as Partial<CanvasDocument> & {
    shapes?: Array<{
      id: string;
      type: "rect" | "circle" | "arrow";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
    }>;
  };

  if (Array.isArray(maybeCanvas.layers)) {
    return { version: 2, layers: maybeCanvas.layers };
  }

  if (Array.isArray(maybeCanvas.shapes)) {
    return {
      version: 2,
      layers: maybeCanvas.shapes.map((shape) => ({
        id: shape.id,
        kind: "shape" as const,
        shape:
          shape.type === "circle"
            ? "ellipse"
            : shape.type === "arrow"
            ? "line"
            : "rect",
        start: { x: shape.x, y: shape.y },
        end: { x: shape.x + shape.width, y: shape.y + shape.height },
        color: shape.color,
        size: 3,
      })),
    };
  }

  return { version: 2, layers: [] };
}

export function isPointNearLayer(layer: CanvasLayer, point: Point) {
  if (layer.kind === "stroke") {
    for (let index = 0; index < layer.points.length - 1; index += 1) {
      if (
        distanceToSegment(point, layer.points[index], layer.points[index + 1]) <=
        Math.max(layer.size, 10)
      ) {
        return true;
      }
    }
    return false;
  }

  const minX = Math.min(layer.start.x, layer.end.x) - Math.max(layer.size, 10);
  const maxX = Math.max(layer.start.x, layer.end.x) + Math.max(layer.size, 10);
  const minY = Math.min(layer.start.y, layer.end.y) - Math.max(layer.size, 10);
  const maxY = Math.max(layer.start.y, layer.end.y) + Math.max(layer.size, 10);

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

export function renderShape(layer: ShapeLayer) {
  const x = Math.min(layer.start.x, layer.end.x);
  const y = Math.min(layer.start.y, layer.end.y);
  const width = Math.abs(layer.end.x - layer.start.x);
  const height = Math.abs(layer.end.y - layer.start.y);

  if (layer.shape === "line") {
    return (
      <line
        key={layer.id}
        x1={layer.start.x}
        y1={layer.start.y}
        x2={layer.end.x}
        y2={layer.end.y}
        stroke={layer.color}
        strokeWidth={layer.size}
        strokeLinecap="round"
      />
    );
  }

  if (layer.shape === "rect") {
    return (
      <rect
        key={layer.id}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill={`${layer.color}18`}
        stroke={layer.color}
        strokeWidth={layer.size}
      />
    );
  }

  return (
    <ellipse
      key={layer.id}
      cx={x + width / 2}
      cy={y + height / 2}
      rx={width / 2}
      ry={height / 2}
      fill={`${layer.color}18`}
      stroke={layer.color}
      strokeWidth={layer.size}
    />
  );
}

// Re-export StrokeLayer so Canvas.tsx can use it from one import
export type { StrokeLayer };
