"use client";

import type { Element } from "@obnofi/types/clearing";
import type { PresenceUser } from "@/store/usePresenceStore";

function getSelectionBounds(elements: Element[], selectedIds: string[]) {
  const selectedElements = elements.filter((element) => selectedIds.includes(element.id));
  if (selectedElements.length === 0) {
    return null;
  }

  const minX = Math.min(...selectedElements.map((element) => element.x));
  const minY = Math.min(...selectedElements.map((element) => element.y));
  const maxX = Math.max(...selectedElements.map((element) => element.x + element.width));
  const maxY = Math.max(...selectedElements.map((element) => element.y + element.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function CursorLayer({
  elements,
  peers,
}: {
  elements: Element[];
  peers: PresenceUser[];
}) {
  return (
    <>
      {peers.map((peer) => {
        const selectionBounds = getSelectionBounds(elements, peer.selectedIds);
        return (
          <div key={peer.id}>
            {selectionBounds ? (
              <div
                className="pointer-events-none absolute z-30 border-2"
                style={{
                  left: selectionBounds.x,
                  top: selectionBounds.y,
                  width: selectionBounds.width,
                  height: selectionBounds.height,
                  borderColor: peer.color,
                  boxShadow: `0 0 0 1px ${peer.color} inset`,
                }}
              />
            ) : null}

            {peer.cursor ? (
              <div
                className="pointer-events-none absolute z-40"
                style={{
                  left: peer.cursor.x,
                  top: peer.cursor.y,
                }}
              >
                <div
                  className="h-4 w-4 rotate-[-18deg] rounded-[4px]"
                  style={{ backgroundColor: peer.color }}
                />
                <span
                  className="mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: peer.color }}
                >
                  {peer.name}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
