"use client";

import { useMemo } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Table } from "@tanstack/react-table";
import { GripVertical, Plus } from "lucide-react";
import { Page, Property, PropertyValueData, SelectOption } from "@/types";
import { getPropertyValueData } from "@/hooks/useGroveTable";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";

interface BoardViewProps {
  table: Table<Page>;
  properties: Property[];
  groupByPropertyId?: string | null;
  onCreateRow?: () => void;
  onOpenRow?: (rowId: string) => void;
  onUpdatePropertyValue?: (
    rowId: string,
    propertyId: string,
    value: PropertyValueData
  ) => void;
}

function SortableCard({
  row,
  onOpenRow,
}: {
  row: Page;
  onOpenRow?: (rowId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: row.id });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpenRow?.(row.id)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {row.title || "Untitled"}
        </p>
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-[var(--color-text-placeholder)]"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </span>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {row.propertyValues?.length ?? 0} properties
      </p>
    </button>
  );
}

function LaneDropZone({
  laneId,
  children,
}: {
  laneId: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `lane:${laneId}` });

  return (
    <div
      ref={setNodeRef}
      id={`lane:${laneId}`}
      className={`flex min-h-20 flex-1 flex-col gap-3 rounded-xl transition ${
        isOver ? "bg-[var(--color-accent-subtle)]/60" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function BoardView({
  table,
  properties,
  groupByPropertyId,
  onCreateRow,
  onOpenRow,
  onUpdatePropertyValue,
}: BoardViewProps) {
  const groupProperty =
    properties.find((property) => property.id === groupByPropertyId) ??
    properties.find(
      (property) => property.type === "select" || property.type === "status"
    );

  const flatRows = table.getPreGroupedRowModel().rows.map((row) => row.original);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const lanes = useMemo(() => {
    if (!groupProperty?.options?.length) {
      return [{ id: "ungrouped", option: null as SelectOption | null, rows: flatRows }];
    }

    const buckets = new Map<string, Page[]>();
    groupProperty.options.forEach((option) => buckets.set(option.id, []));
    const ungrouped: Page[] = [];

    flatRows.forEach((row) => {
      const value = getPropertyValueData(row, groupProperty.id);
      const optionId =
        value && (value.type === "select" || value.type === "status")
          ? value.optionId
          : null;

      if (optionId && buckets.has(optionId)) {
        buckets.get(optionId)?.push(row);
      } else {
        ungrouped.push(row);
      }
    });

    const result: Array<{
      id: string;
      option: SelectOption | null;
      rows: Page[];
    }> = groupProperty.options.map((option) => ({
      id: option.id,
      option,
      rows: buckets.get(option.id) ?? [],
    }));

    result.push({ id: "ungrouped", option: null, rows: ungrouped });
    return result;
  }, [flatRows, groupProperty]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!groupProperty) {
      return;
    }

    const rowId = String(event.active.id);
    const overId =
      typeof event.over?.id === "string" ? String(event.over.id) : null;
    const targetLaneId = overId
      ? overId.startsWith("lane:")
        ? overId.replace("lane:", "")
        : lanes.find((lane) => lane.rows.some((row) => row.id === overId))?.id ?? null
      : null;

    if (!targetLaneId || targetLaneId === "ungrouped") {
      return;
    }

    onUpdatePropertyValue?.(rowId, groupProperty.id, {
      type: groupProperty.type === "status" ? "status" : "select",
      optionId: targetLaneId,
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto p-4">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-2xl bg-[var(--color-surface)] p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              {lane.option ? (
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: getOptionBgColor(lane.option.color),
                    color: getOptionTextColor(lane.option.color),
                  }}
                >
                  {lane.option.label}
                </span>
              ) : (
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Unassigned
                </span>
              )}
              <span className="text-xs text-[var(--color-text-secondary)]">
                {lane.rows.length}
              </span>
            </div>
            <SortableContext
              id={`lane:${lane.id}`}
              items={lane.rows.map((row) => row.id)}
              strategy={verticalListSortingStrategy}
            >
              <LaneDropZone laneId={lane.id}>
                {lane.rows.map((row) => (
                  <SortableCard key={row.id} row={row} onOpenRow={onOpenRow} />
                ))}
              </LaneDropZone>
            </SortableContext>
            <button
              type="button"
              onClick={onCreateRow}
              className="mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
            >
              <Plus className="h-4 w-4" />
              Plant Seed
            </button>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
