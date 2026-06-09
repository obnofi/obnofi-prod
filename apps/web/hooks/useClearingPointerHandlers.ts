import { useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ConnectorHandlePosition } from "@/components/elements/ConnectorHandles";
import type { DraftConnectorApi } from "@/components/canvas/DraftConnectorLayer";
import type { DragState, DrawState, LassoState, PanState } from "@/lib/canvas/clearingBoardTypes";
import { getScenePoint } from "@/lib/canvas/clearingBoardUtils";
import type { Element, Room, User } from "@obnofi/types/clearing";
import {
  useClearingBoardPointerDown,
  useClearingBoardPointerUp,
  type ClearingBoardPointerDownOptions,
  type ClearingBoardPointerUpOptions,
} from "@/hooks/useClearingDragHandlers";

type ViewportState = { x: number; y: number; zoom: number; scale?: number };

export type ClearingPointerHandlerOptions = {
  boardRef: React.RefObject<HTMLDivElement | null>;
  dragStateRef: React.MutableRefObject<DragState>;
  dragUpdateFrameRef: React.MutableRefObject<number | null>;
  pendingDragPatchesRef: React.MutableRefObject<Record<string, Partial<Element>> | null>;
  panStateRef: React.MutableRefObject<PanState>;
  drawStateRef: React.MutableRefObject<DrawState>;
  lassoStateRef: React.MutableRefObject<LassoState>;
  lastScenePointRef: React.MutableRefObject<{ x: number; y: number }>;
  viewportRef: React.MutableRefObject<ViewportState>;
  draftConnectorApiRef: React.MutableRefObject<DraftConnectorApi | null>;
  currentRoomRef: React.MutableRefObject<Room | null>;
  currentUserRef: React.MutableRefObject<User | null>;
  presenceChannelRef: React.MutableRefObject<RealtimeChannel | null>;
  lastCursorSyncRef: React.MutableRefObject<number>;
  viewport: ViewportState;
  elements: Element[];
  elementLookup: Record<string, Element>;
  selectedIds: string[];
  selectedElementId: string | null;
  tool: string;
  lineStyle: string;
  activeEmojiStamp: string | null;
  selectionBounds: { x: number; y: number; width: number; height: number } | null;
  setViewport: (patch: Partial<ViewportState>) => void;
  setPropertyPanelElementId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedElement: (id: string | null) => void;
  setTool: (tool: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  setActiveThreadTarget: React.Dispatch<React.SetStateAction<{ elementId: string | null; x: number; y: number } | null>>;
  setConnectorCursor: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  setActiveEmojiStamp: React.Dispatch<React.SetStateAction<string | null>>;
  setFloatingStamps: React.Dispatch<React.SetStateAction<import("@/components/elements/EmojiStamp").FloatingEmojiStamp[]>>;
  setSelectionBounds: (bounds: { x: number; y: number; width: number; height: number } | null) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  selectSingle: (id: string) => void;
  toggleSelectedId: (id: string) => void;
  addElement: (el: Element) => void;
  updateElement: (id: string, patch: Partial<Element>) => void;
  updateElements: (patches: Record<string, Partial<Element>>) => void;
  pushHistory: (snapshot?: Element[]) => void;
  persistElement: (el: Element) => Promise<void>;
};

export function useClearingPointerHandlers(opts: ClearingPointerHandlerOptions) {
  const {
    boardRef, dragStateRef, dragUpdateFrameRef, pendingDragPatchesRef, lassoStateRef,
    lastScenePointRef, viewportRef, draftConnectorApiRef,
    currentUserRef, presenceChannelRef, lastCursorSyncRef,
    viewport, elements, elementLookup, selectedIds, selectedElementId,
    tool, lineStyle,
    setViewport, setPropertyPanelElementId, setSelectedElement, setConnectorCursor,
    setActiveThreadTarget, setSelectionBounds,
    selectSingle, toggleSelectedId,
    updateElement, updateElements,
  } = opts;

  const handleBoardPointerDown = useClearingBoardPointerDown(opts as unknown as ClearingBoardPointerDownOptions);
  const handleBoardPointerUp = useClearingBoardPointerUp(opts as unknown as ClearingBoardPointerUpOptions);

  const handleElementPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, elementId: string) => {
      if (!boardRef.current) return;
      const element = elementLookup[elementId];
      if (!element) return;
      setPropertyPanelElementId(null);

      const selectedConnector = selectedElementId ? elementLookup[selectedElementId] : null;
      if (tool === "select" && selectedConnector?.type === "connector" && elementId !== selectedElementId) {
        event.stopPropagation();
        const updates: Partial<Element> = {};
        if (!selectedConnector.content.fromElementId) {
          updates.content = { ...selectedConnector.content, fromElementId: elementId };
        } else {
          updates.content = { ...selectedConnector.content, toElementId: elementId };
        }
        updateElement(selectedConnector.id, updates);
        opts.persistElement({ ...selectedConnector, ...updates } as Element);
        return;
      }

      if (tool === "comment") {
        event.stopPropagation();
        setActiveThreadTarget({ elementId, x: event.clientX, y: event.clientY });
        return;
      }

      const rect = boardRef.current.getBoundingClientRect();
      const sp = getScenePoint(event.clientX, event.clientY, rect, viewport.x, viewport.y, viewport.zoom);
      const dragTargets = selectedIds.includes(elementId) && selectedIds.length > 0
        ? elements.filter((item) => selectedIds.includes(item.id))
        : [element];

      if (event.shiftKey) { toggleSelectedId(elementId); }
      else { selectSingle(elementId); setSelectedElement(elementId); }

      const sectionChildOrigins: Record<string, { x: number; y: number }> = {};
      const movingSectionIds = dragTargets.filter((t) => t.type === "section").map((t) => t.id);
      if (movingSectionIds.length > 0) {
        elements.forEach((candidate) => {
          if (candidate.type === "section" || dragTargets.some((t) => t.id === candidate.id)) return;
          for (const sectionId of movingSectionIds) {
            const section = elementLookup[sectionId];
            if (!section) continue;
            const cx = candidate.x + candidate.width / 2;
            const cy = candidate.y + candidate.height / 2;
            if (cx >= section.x && cx <= section.x + section.width && cy >= section.y && cy <= section.y + section.height) {
              sectionChildOrigins[candidate.id] = { x: candidate.x, y: candidate.y };
              break;
            }
          }
        });
      }

      dragStateRef.current = {
        elementId,
        pointerId: event.pointerId,
        offsetX: sp.x - element.x,
        offsetY: sp.y - element.y,
        groupOrigin: Object.fromEntries(dragTargets.map((item) => [item.id, { x: item.x, y: item.y }])),
        sectionChildOrigins: Object.keys(sectionChildOrigins).length > 0 ? sectionChildOrigins : undefined,
        preDragSnapshot: [...elements],
      };
    },
    [boardRef, dragStateRef, elementLookup, elements, opts, selectSingle, selectedElementId,
     selectedIds, setActiveThreadTarget, setPropertyPanelElementId, setSelectedElement, toggleSelectedId, tool,
     updateElement, viewport.x, viewport.y, viewport.zoom]
  );

  const handleConnectorHandleStart = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, elementId: string, position: ConnectorHandlePosition) => {
      const element = elementLookup[elementId];
      if (!element) return;

      let handleX: number;
      let handleY: number;
      switch (position) {
        case "top":    handleX = element.x + element.width / 2; handleY = element.y; break;
        case "right":  handleX = element.x + element.width;     handleY = element.y + element.height / 2; break;
        case "bottom": handleX = element.x + element.width / 2; handleY = element.y + element.height; break;
        default:       handleX = element.x;                     handleY = element.y + element.height / 2;
      }

      const hasArrow = lineStyle === "arrow";
      const ls = (lineStyle === "arrow" ? "solid" : lineStyle) as "solid" | "dashed" | "dotted";
      opts.drawStateRef.current = {
        elementId: crypto.randomUUID(), startX: handleX, startY: handleY,
        isDraftConnector: true, connectorHasArrow: hasArrow, connectorLineStyle: ls, fromElementId: elementId,
      };
      lastScenePointRef.current = { x: handleX, y: handleY };
      boardRef.current?.setPointerCapture(event.pointerId);

      const vp = viewportRef.current;
      const bx = vp.x + handleX * vp.zoom;
      const by = vp.y + handleY * vp.zoom;
      draftConnectorApiRef.current?.update(bx, by, bx, by, "#2E7D45", 2 * vp.zoom, hasArrow, ls);
    },
    [boardRef, draftConnectorApiRef, elementLookup, lastScenePointRef, lineStyle, opts, viewportRef]
  );

  const handleBoardPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): { x: number; y: number } | undefined => {
      if (!boardRef.current) return;

      if (tool === "connector") {
        setConnectorCursor({ x: event.clientX, y: event.clientY });
      } else {
        setConnectorCursor(null);
      }

      const rect = boardRef.current.getBoundingClientRect();
      const sp = getScenePoint(event.clientX, event.clientY, rect, viewport.x, viewport.y, viewport.zoom);

      if (dragStateRef.current) {
        const d = dragStateRef.current;
        const target = elementLookup[d.elementId];
        if (!target) return;

        const dx = sp.x - d.offsetX - target.x;
        const dy = sp.y - d.offsetY - target.y;
        const ts = new Date().toISOString();
        const patches: Record<string, Partial<Element>> = {};

        Object.keys(d.groupOrigin).forEach((id) => {
          const o = d.groupOrigin[id];
          if (o) patches[id] = { x: o.x + dx, y: o.y + dy, updatedAt: ts };
        });
        if (d.sectionChildOrigins) {
          Object.entries(d.sectionChildOrigins).forEach(([childId, o]) => {
            patches[childId] = { x: o.x + dx, y: o.y + dy, updatedAt: ts };
          });
        }
        pendingDragPatchesRef.current = patches;
        if (dragUpdateFrameRef.current == null) {
          dragUpdateFrameRef.current = window.requestAnimationFrame(() => {
            dragUpdateFrameRef.current = null;
            const nextPatches = pendingDragPatchesRef.current;
            pendingDragPatchesRef.current = null;
            if (nextPatches) {
              updateElements(nextPatches);
            }
          });
        }
      }

      lastScenePointRef.current = sp;

      if (opts.drawStateRef.current) {
        const ds = opts.drawStateRef.current;
        if (ds.isDraftConnector) {
          const vp = viewportRef.current;
          draftConnectorApiRef.current?.update(
            vp.x + ds.startX * vp.zoom, vp.y + ds.startY * vp.zoom,
            vp.x + sp.x * vp.zoom, vp.y + sp.y * vp.zoom,
            "#2E7D45", 2 * vp.zoom,
            ds.connectorHasArrow ?? false,
            (ds.connectorLineStyle ?? "solid") as "solid" | "dashed" | "dotted"
          );
        } else {
          const draftEl = elementLookup[ds.elementId];
          if (draftEl?.type === "shape" || draftEl?.type === "section") {
            updateElement(draftEl.id, {
              x: Math.min(ds.startX, sp.x), y: Math.min(ds.startY, sp.y),
              width: Math.max(12, Math.abs(sp.x - ds.startX)),
              height: Math.max(12, Math.abs(sp.y - ds.startY)),
              updatedAt: new Date().toISOString(),
            });
          } else if (draftEl?.type === "connector") {
            updateElement(draftEl.id, {
              x: 0, y: 0, width: 0, height: 0,
              content: { ...draftEl.content, start: { x: ds.startX, y: ds.startY }, end: sp },
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      if (lassoStateRef.current) {
        setSelectionBounds({
          x: Math.min(lassoStateRef.current.startX, sp.x),
          y: Math.min(lassoStateRef.current.startY, sp.y),
          width: Math.abs(sp.x - lassoStateRef.current.startX),
          height: Math.abs(sp.y - lassoStateRef.current.startY),
        });
        lassoStateRef.current = { ...lassoStateRef.current, currentX: sp.x, currentY: sp.y };
      }

      if (opts.panStateRef.current) {
        const p = opts.panStateRef.current;
        setViewport({ x: p.originX + (event.clientX - p.startX), y: p.originY + (event.clientY - p.startY) });
      }

      const now = Date.now();
      if (now - lastCursorSyncRef.current < 80) return sp;
      lastCursorSyncRef.current = now;

      if (presenceChannelRef.current && currentUserRef.current) {
        const nextUser = { ...currentUserRef.current, cursor: sp, lastSeenAt: new Date().toISOString() };
        currentUserRef.current = nextUser as User;
        void presenceChannelRef.current.track(nextUser);
      }

      return sp;
    },
    [boardRef, currentUserRef, draftConnectorApiRef, dragStateRef, dragUpdateFrameRef, elementLookup,
     lassoStateRef, lastCursorSyncRef, lastScenePointRef, opts,
     pendingDragPatchesRef, presenceChannelRef, setConnectorCursor, setSelectionBounds, setViewport,
     tool, updateElement, updateElements, viewport.x, viewport.y, viewport.zoom, viewportRef]
  );

  return {
    handleElementPointerDown,
    handleConnectorHandleStart,
    handleBoardPointerDown,
    handleBoardPointerMove,
    handleBoardPointerUp,
  };
}
