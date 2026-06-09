import { useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { DragState, DrawState, LassoState, PanState } from "@/lib/canvas/clearingBoardTypes";
import { getScenePoint } from "@/lib/canvas/clearingBoardUtils";
import type { DraftConnectorApi } from "@/components/canvas/DraftConnectorLayer";
import type { Element, Room, User } from "@obnofi/types/clearing";

type ViewportState = { x: number; y: number; zoom: number; scale?: number };

export type ClearingBoardPointerDownOptions = {
  boardRef: React.RefObject<HTMLDivElement | null>;
  dragStateRef: React.MutableRefObject<DragState>;
  panStateRef: React.MutableRefObject<PanState>;
  drawStateRef: React.MutableRefObject<DrawState>;
  lassoStateRef: React.MutableRefObject<LassoState>;
  lastScenePointRef: React.MutableRefObject<{ x: number; y: number }>;
  viewportRef: React.MutableRefObject<ViewportState>;
  draftConnectorApiRef: React.MutableRefObject<DraftConnectorApi | null>;
  currentRoomRef: React.MutableRefObject<Room | null>;
  currentUserRef: React.MutableRefObject<User | null>;
  presenceChannelRef: React.MutableRefObject<RealtimeChannel | null>;
  viewport: ViewportState;
  elements: Element[];
  tool: string;
  lineStyle: string;
  activeEmojiStamp: string | null;
  setViewport: (patch: Partial<ViewportState>) => void;
  setPropertyPanelElementId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedElement: (id: string | null) => void;
  setTool: (tool: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  setActiveThreadTarget: React.Dispatch<React.SetStateAction<{ elementId: string | null; x: number; y: number } | null>>;
  setActiveEmojiStamp: React.Dispatch<React.SetStateAction<string | null>>;
  setFloatingStamps: React.Dispatch<React.SetStateAction<import("@/components/elements/EmojiStamp").FloatingEmojiStamp[]>>;
  setSelectionBounds: (bounds: { x: number; y: number; width: number; height: number } | null) => void;
  clearSelection: () => void;
  selectSingle: (id: string) => void;
  addElement: (el: Element) => void;
  pushHistory: (snapshot?: Element[]) => void;
  persistElement: (el: Element) => Promise<void>;
};

export function useClearingBoardPointerDown({
  boardRef, panStateRef, drawStateRef, lassoStateRef,
  lastScenePointRef, viewportRef, draftConnectorApiRef,
  currentRoomRef, currentUserRef, presenceChannelRef,
  viewport, elements, tool, lineStyle, activeEmojiStamp,
  setPropertyPanelElementId, setSelectedElement, setTool, setContextMenu,
  setActiveThreadTarget, setActiveEmojiStamp, setFloatingStamps,
  setSelectionBounds, clearSelection, selectSingle,
  addElement, pushHistory, persistElement,
}: ClearingBoardPointerDownOptions) {
  return useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!boardRef.current) return;
      setContextMenu(null);
      setPropertyPanelElementId(null);
      if (event.target !== event.currentTarget) return;
      if (!event.shiftKey) { clearSelection(); setSelectedElement(null); }

      const rect = boardRef.current.getBoundingClientRect();
      const sp = getScenePoint(event.clientX, event.clientY, rect, viewport.x, viewport.y, viewport.zoom);
      const activeRoom = currentRoomRef.current;
      const activeUser = currentUserRef.current;

      if (tool === "connector" && activeRoom && activeUser) {
        const hasArrow = lineStyle === "arrow";
        const ls = lineStyle === "arrow" ? "solid" : lineStyle;
        drawStateRef.current = { elementId: crypto.randomUUID(), startX: sp.x, startY: sp.y, isDraftConnector: true, connectorHasArrow: hasArrow, connectorLineStyle: ls };
        lastScenePointRef.current = sp;
        const vp = viewportRef.current;
        draftConnectorApiRef.current?.update(vp.x + sp.x * vp.zoom, vp.y + sp.y * vp.zoom, vp.x + sp.x * vp.zoom, vp.y + sp.y * vp.zoom, "#2E7D45", 2 * vp.zoom, hasArrow, ls as "solid" | "dashed" | "dotted");
        return;
      }

      if ((tool === "shape-rectangle" || tool === "shape-ellipse" || tool === "shape-diamond" || tool === "shape-triangle") && activeRoom && activeUser) {
        pushHistory();
        const shape = tool === "shape-ellipse" ? "ellipse" : tool === "shape-diamond" ? "diamond" : tool === "shape-triangle" ? "triangle" : "rectangle";
        const el: Element = {
          id: crypto.randomUUID(), roomId: activeRoom.id, type: "shape",
          x: sp.x, y: sp.y, width: 1, height: 1, rotation: 0,
          zIndex: elements.length + 1, createdBy: activeUser.id,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          style: { color: "#2E7D45", strokeWidth: 2, opacity: 1 },
          content: { kind: "shape", shape, fill: "#F7F7F5", label: "" },
        };
        addElement(el); selectSingle(el.id); setSelectedElement(el.id);
        drawStateRef.current = { elementId: el.id, startX: sp.x, startY: sp.y };
        return;
      }

      if (tool === "text" && activeRoom && activeUser) {
        pushHistory();
        const el: Element = {
          id: crypto.randomUUID(), roomId: activeRoom.id, type: "text",
          x: sp.x, y: sp.y, width: 220, height: 48, rotation: 0,
          zIndex: elements.length + 1, createdBy: activeUser.id,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          style: { color: "#37352F", opacity: 1 },
          content: { kind: "text", text: "", fontSize: 28, align: "left", weight: 600 },
        };
        addElement(el); selectSingle(el.id); setSelectedElement(el.id);
        void persistElement(el); setTool("select"); return;
      }

      if (tool === "vine" && activeRoom && activeUser) {
        pushHistory();
        const el: Element = {
          id: crypto.randomUUID(), roomId: activeRoom.id, type: "vine",
          x: sp.x, y: sp.y, width: 220, height: 72, rotation: 0,
          zIndex: elements.length + 1, createdBy: activeUser.id,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          style: { color: "#D7DDD9", opacity: 1 },
          content: { kind: "vine", text: "", fontSize: 22, weight: 600, fill: "#FFFFFF" },
        };
        addElement(el); selectSingle(el.id); setSelectedElement(el.id);
        void persistElement(el); setTool("select"); return;
      }

      if (tool === "comment") {
        setActiveThreadTarget({ elementId: null, x: sp.x, y: sp.y });
        return;
      }

      if (tool === "pen" || tool === "marker") return;

      if (activeEmojiStamp) {
        const stamp = { id: crypto.randomUUID(), emoji: activeEmojiStamp, x: sp.x, y: sp.y, createdAt: Date.now(), userName: currentUserRef.current?.name };
        setFloatingStamps((c) => [...c, stamp]);
        if (presenceChannelRef.current) void presenceChannelRef.current.send({ type: "broadcast", event: "emoji-stamp", payload: stamp });
        setActiveEmojiStamp(null);
        return;
      }

      if (tool === "section" && activeRoom && activeUser) {
        pushHistory();
        const el: Element = {
          id: crypto.randomUUID(), roomId: activeRoom.id, type: "section",
          x: sp.x, y: sp.y, width: 1, height: 1, rotation: 0,
          zIndex: -1000, createdBy: activeUser.id,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          style: { color: "#2E7D45", opacity: 1 },
          content: { kind: "section", title: "Section", background: "rgba(46,125,69,0.08)" },
        };
        addElement(el); selectSingle(el.id); setSelectedElement(el.id);
        drawStateRef.current = { elementId: el.id, startX: sp.x, startY: sp.y };
        return;
      }

      lassoStateRef.current = { startX: sp.x, startY: sp.y, currentX: sp.x, currentY: sp.y };
      setSelectionBounds({ x: sp.x, y: sp.y, width: 0, height: 0 });
      panStateRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y };
    },
    [
      activeEmojiStamp, addElement, boardRef, clearSelection, currentRoomRef, currentUserRef,
      draftConnectorApiRef, drawStateRef, elements, lassoStateRef, lastScenePointRef,
      lineStyle, panStateRef, persistElement, presenceChannelRef, pushHistory,
      selectSingle, setActiveEmojiStamp, setActiveThreadTarget, setContextMenu,
      setFloatingStamps, setPropertyPanelElementId, setSelectedElement, setSelectionBounds, setTool,
      tool, viewport.x, viewport.y, viewport.zoom, viewportRef,
    ]
  );
}

export type ClearingBoardPointerUpOptions = {
  dragStateRef: React.MutableRefObject<DragState>;
  dragUpdateFrameRef: React.MutableRefObject<number | null>;
  pendingDragPatchesRef: React.MutableRefObject<Record<string, Partial<Element>> | null>;
  panStateRef: React.MutableRefObject<PanState>;
  drawStateRef: React.MutableRefObject<DrawState>;
  lassoStateRef: React.MutableRefObject<LassoState>;
  lastScenePointRef: React.MutableRefObject<{ x: number; y: number }>;
  draftConnectorApiRef: React.MutableRefObject<DraftConnectorApi | null>;
  currentRoomRef: React.MutableRefObject<Room | null>;
  currentUserRef: React.MutableRefObject<User | null>;
  elements: Element[];
  elementLookup: Record<string, Element>;
  selectionBounds: { x: number; y: number; width: number; height: number } | null;
  setSelectedElement: (id: string | null) => void;
  setTool: (tool: string) => void;
  setSelectedIds: (ids: string[]) => void;
  setSelectionBounds: (bounds: { x: number; y: number; width: number; height: number } | null) => void;
  selectSingle: (id: string) => void;
  addElement: (el: Element) => void;
  updateElements: (patches: Record<string, Partial<Element>>) => void;
  pushHistory: (snapshot?: Element[]) => void;
  persistElement: (el: Element) => Promise<void>;
};

export function useClearingBoardPointerUp({
  dragStateRef, dragUpdateFrameRef, pendingDragPatchesRef, panStateRef, drawStateRef, lassoStateRef,
  lastScenePointRef, draftConnectorApiRef,
  currentRoomRef, currentUserRef, elements, elementLookup, selectionBounds,
  setSelectedElement, setTool, setSelectedIds, setSelectionBounds,
  selectSingle, addElement, updateElements, pushHistory, persistElement,
}: ClearingBoardPointerUpOptions) {
  return useCallback(async () => {
    if (dragUpdateFrameRef.current != null) {
      window.cancelAnimationFrame(dragUpdateFrameRef.current);
      dragUpdateFrameRef.current = null;
    }
    if (pendingDragPatchesRef.current) {
      updateElements(pendingDragPatchesRef.current);
      pendingDragPatchesRef.current = null;
    }

    if (dragStateRef.current) {
      const didMove = Object.entries(dragStateRef.current.groupOrigin).some(([id, origin]) => {
        const el = elementLookup[id];
        return el && (Math.abs(el.x - origin.x) > 1 || Math.abs(el.y - origin.y) > 1);
      });
      if (didMove) pushHistory(dragStateRef.current.preDragSnapshot);
      await Promise.all(
        Object.keys(dragStateRef.current.groupOrigin).map(async (id) => {
          const el = elementLookup[id];
          if (el) await persistElement(el);
        })
      );
    }

    if (drawStateRef.current) {
      if (drawStateRef.current.isDraftConnector) {
        const ds = drawStateRef.current;
        const endPoint = lastScenePointRef.current;
        draftConnectorApiRef.current?.hide();
        const dist = Math.hypot(endPoint.x - ds.startX, endPoint.y - ds.startY);

        if (dist > 5 && currentRoomRef.current && currentUserRef.current) {
          const activeRoom = currentRoomRef.current;
          const activeUser = currentUserRef.current;
          let toElementId: string | undefined;
          let snappedEnd = endPoint;
          let bestSnapDist = 40;
          for (const el of elements) {
            if (el.type === "connector" || el.type === "path" || el.id === ds.fromElementId) continue;
            const padding = 20;
            if (endPoint.x >= el.x - padding && endPoint.x <= el.x + el.width + padding &&
                endPoint.y >= el.y - padding && endPoint.y <= el.y + el.height + padding) {
              const centerDist = Math.hypot(endPoint.x - (el.x + el.width / 2), endPoint.y - (el.y + el.height / 2));
              if (centerDist < bestSnapDist) {
                bestSnapDist = centerDist; toElementId = el.id;
                snappedEnd = { x: el.x + el.width / 2, y: el.y + el.height / 2 };
              }
            }
          }
          pushHistory();
          const nextElement: Element = {
            id: ds.elementId, roomId: activeRoom.id, type: "connector",
            x: 0, y: 0, width: 0, height: 0, rotation: 0,
            zIndex: elements.length + 1, createdBy: activeUser.id,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            style: { color: "#2E7D45", strokeWidth: 2, opacity: 1 },
            content: {
              kind: "connector",
              start: { x: ds.startX, y: ds.startY }, end: snappedEnd,
              arrowStart: false, arrowEnd: ds.connectorHasArrow ?? false,
              lineStyle: (ds.connectorLineStyle ?? "solid") as "solid" | "dashed" | "dotted",
              fromElementId: ds.fromElementId, toElementId,
            },
          };
          addElement(nextElement); selectSingle(nextElement.id); setSelectedElement(nextElement.id);
          await persistElement(nextElement);
        }
        drawStateRef.current = null;
        setTool("connector");
      } else {
        const drawnElement = elementLookup[drawStateRef.current.elementId];
        if (drawnElement) await persistElement(drawnElement);
        const wasConnectorDraw = drawnElement?.type === "connector";
        drawStateRef.current = null;
        setTool(wasConnectorDraw ? "connector" : "select");
      }
    }

    if (lassoStateRef.current && selectionBounds) {
      const insideIds = elements
        .filter((el) => {
          const { x: bx, y: by, width: bw, height: bh } = selectionBounds;
          return el.x >= bx && el.y >= by && el.x + el.width <= bx + bw && el.y + el.height <= by + bh;
        })
        .map((el) => el.id);
      setSelectedIds(insideIds);
      setSelectedElement(insideIds[0] ?? null);
      setSelectionBounds(null);
      lassoStateRef.current = null;
    }

    dragStateRef.current = null;
    panStateRef.current = null;
  }, [
    addElement, currentRoomRef, currentUserRef, dragStateRef, dragUpdateFrameRef, draftConnectorApiRef,
    drawStateRef, elementLookup, elements, lassoStateRef, lastScenePointRef,
    panStateRef, pendingDragPatchesRef, persistElement, pushHistory,
    selectSingle, selectionBounds, setSelectedElement, setSelectedIds,
    setSelectionBounds, setTool, updateElements,
  ]);
}
