import type { Element } from "@obnofi/types/clearing";
import { getElementCenter } from "./clearingBoardUtils";

export function buildConnectorElement(
  roomId: string,
  userId: string,
  elements: Element[],
  index: number
): Element {
  const firstSticky = elements.find((element) => element.type === "sticky");
  const firstVine = elements.find((element) => element.type === "vine");
  const firstText = elements.find((element) => element.type === "text");
  const fromTarget = firstVine ?? firstSticky;
  const toTarget = firstText ?? firstVine ?? firstSticky;
  const fromPoint = fromTarget ? getElementCenter(fromTarget) : { x: 580, y: 270 };
  const toPoint = toTarget ? getElementCenter(toTarget) : { x: 980, y: 320 };

  return {
    id: crypto.randomUUID(),
    roomId,
    type: "connector",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    zIndex: index,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    style: {
      color: "fern",
      strokeWidth: 3,
      opacity: 1,
    },
    content: {
      kind: "connector",
      arrowStart: false,
      arrowEnd: true,
      lineStyle: "solid",
      start: fromPoint,
      end: toPoint,
      fromElementId: fromTarget?.id,
      toElementId: toTarget?.id,
      label: "flow",
    },
  };
}

export function buildPathElement(roomId: string, userId: string, index: number): Element {
  return {
    id: crypto.randomUUID(),
    roomId,
    type: "path",
    x: 640,
    y: 520,
    width: 220,
    height: 140,
    rotation: 0,
    zIndex: index,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    style: {
      color: "sky",
      strokeWidth: 5,
      opacity: 1,
    },
    content: {
      kind: "path",
      points: [
        { x: 0, y: 90 },
        { x: 40, y: 20 },
        { x: 95, y: 48 },
        { x: 140, y: 14 },
        { x: 190, y: 110 },
        { x: 220, y: 72 },
      ],
      closed: false,
    },
  };
}

export function buildElement(
  kind: Element["type"],
  roomId: string,
  userId: string,
  index: number,
  elements: Element[]
): Element {
  const timestamp = new Date().toISOString();
  const base = {
    id: crypto.randomUUID(),
    roomId,
    x: 900 + (index % 3) * 48,
    y: 380 + (index % 4) * 40,
    rotation: 0,
    zIndex: index,
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (kind === "sticky") {
    return {
      ...base,
      type: "sticky",
      width: 240,
      height: 210,
      style: {
        color: "sun",
        opacity: 1,
      },
      content: {
        kind: "sticky",
        text: "Map the user journey\nFrame key decisions\nKeep the grove tidy",
        tone: "sun",
      },
    };
  }

  if (kind === "shape") {
    return {
      ...base,
      type: "shape",
      width: 260,
      height: 160,
      style: {
        color: "fern",
        strokeWidth: 2,
        opacity: 1,
      },
      content: {
        kind: "shape",
        shape: "rectangle",
        fill: "mist",
        label: "Decision frame",
      },
    };
  }

  if (kind === "text") {
    return {
      ...base,
      type: "text",
      width: 320,
      height: 72,
      style: {
        color: "ink",
        opacity: 1,
      },
      content: {
        kind: "text",
        text: "Clearing board for workshop notes",
        fontSize: 28,
        align: "left",
        weight: 600,
      },
    };
  }

  if (kind === "vine") {
    return {
      ...base,
      type: "vine",
      width: 220,
      height: 72,
      style: {
        color: "#D7DDD9",
        opacity: 1,
      },
      content: {
        kind: "vine",
        text: "Branch out",
        fontSize: 22,
        weight: 600,
        fill: "#FFFFFF",
      },
    };
  }

  if (kind === "path") {
    return buildPathElement(roomId, userId, index);
  }

  return buildConnectorElement(roomId, userId, elements, index);
}
