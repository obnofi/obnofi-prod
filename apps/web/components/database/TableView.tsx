"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { flexRender, type Row, type Table } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Property, Page, PropertyType, SelectOption } from "@obnofi/types";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/database-utils";
import { PropertyHeader } from "./PropertyHeader";

interface TableViewProps {
  pageId: string;
  table: Table<Page>;
  properties: Property[];
  onCreateRow?: () => void;
  onOpenRow?: (rowId: string) => void;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  onUpdateProperty?: (propertyId: string, updates: { name?: string; type?: PropertyType; options?: SelectOption[] }) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onMoveProperty?: (propertyId: string, direction: "left" | "right") => void;
  compact?: boolean;
}

const ADDABLE_TYPES: PropertyType[] = [
  "text", "number", "select", "multi_select", "date", "checkbox", "url", "email", "phone", "status",
];

export function TableView({
  pageId,
  table,
  properties: _properties,
  onCreateRow,
  onOpenRow,
  onCreateProperty,
  onUpdateProperty,
  onDeleteProperty,
  onMoveProperty,
  compact = false,
}: TableViewProps) {
  const collaboration = useCollaboration();
  const awarenessStates = Array.isArray(collaboration.awarenessStates)
    ? collaboration.awarenessStates
    : [];
  const updateCursor = collaboration.updateCursor ?? (() => {});
  const localUserId = collaboration.localUserId ?? null;
  const [showAddProp, setShowAddProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState<PropertyType>("text");
  const addPropRef = useRef<HTMLTableCellElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const occupiedCells = useMemo(() => {
    const occupied = new Map<string, Array<{ userId: string; userName: string; color: string }>>();

    awarenessStates.forEach((state) => {
      const databaseCell = state.userCursor?.databaseCell;
      if (
        state.userId === localUserId ||
        state.userCursor?.type !== "database" ||
        state.userCursor?.pageId !== pageId ||
        !databaseCell
      ) {
        return;
      }

      const key = `${databaseCell.rowId}:${databaseCell.colId}`;
      const current = occupied.get(key) ?? [];
      current.push({
        userId: state.userId,
        userName: state.userName,
        color: state.color,
      });
      occupied.set(key, current);
    });

    return occupied;
  }, [awarenessStates, localUserId, pageId]);

  useEffect(() => {
    updateCursor({
      type: "database",
      pageId,
      canvasPosition: null,
      databaseCell: null,
    });

    return () => {
      updateCursor(null);
    };
  }, [pageId, updateCursor]);

  const openAddProp = () => {
    setNewPropName("");
    setNewPropType("text");
    setShowAddProp(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const confirmAddProp = () => {
    const name = newPropName.trim() || getPropertyTypeLabel(newPropType);
    onCreateProperty?.(name, newPropType);
    setShowAddProp(false);
  };

  const handleRowClick = (
    event: React.MouseEvent<HTMLTableRowElement>,
    row: Row<Page>
  ) => {
    if (!onOpenRow || row.getIsGrouped()) {
      return;
    }

    const target = event.target as HTMLElement;
    if (
      target.closest(
        "button, input, select, textarea, a, [contenteditable='true'], [data-grove-dropdown-portal='true']"
      )
    ) {
      return;
    }

    onOpenRow(row.original.id);
  };

  const handleCellEnter = (rowId: string, colId: string) => {
    updateCursor({
      type: "database",
      pageId,
      canvasPosition: null,
      databaseCell: { rowId, colId },
    });
  };

  const handleCellLeave = (
    event: React.FocusEvent<HTMLTableCellElement>,
    rowId: string,
    colId: string
  ) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    updateCursor({
      type: "database",
      pageId,
      canvasPosition: null,
      databaseCell: null,
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[var(--color-border)]"
              >
                {headerGroup.headers.map((header) => {
                  const isTitleColumn = header.column.id === "title";
                  const isGrouped = header.column.getIsGrouped();
                  if (header.isPlaceholder) {
                    return null;
                  }

                  // Find property for this column (if not title column)
                  const property = !isTitleColumn
                    ? _properties.find((p) => p.id === header.column.id)
                    : null;

                  return (
                    <th
                      key={header.id}
                      className={`relative bg-[var(--color-surface)] px-0 py-0 text-left border-r border-[var(--color-border)] ${
                        isTitleColumn
                          ? `sticky left-0 z-10 ${compact ? "w-48" : "w-64"} px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]`
                          : compact
                          ? "w-32 min-w-[7rem]"
                          : "w-40 min-w-[9rem]"
                      }`}
                    >
                      {isTitleColumn ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)]"
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {header.column.getIsSorted() === "asc" ? "↑" : ""}
                          {header.column.getIsSorted() === "desc" ? "↓" : ""}
                        </button>
                      ) : property ? (
                        <PropertyHeader
                          property={property}
                          onRename={(name) => onUpdateProperty?.(property.id, { name })}
                          onChangeType={(type) => onUpdateProperty?.(property.id, { type })}
                          onUpdateOptions={(options) => onUpdateProperty?.(property.id, { options })}
                          onDelete={() => onDeleteProperty?.(property.id)}
                          onMove={(direction) => onMoveProperty?.(property.id, direction)}
                          canMoveLeft={property.order > 0}
                          canMoveRight={property.order < _properties.length - 1}
                        />
                      ) : (
                        <span className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                      )}
                      {isGrouped ? (
                        <span className="ml-2 rounded-full bg-[var(--color-accent-subtle)] px-2 py-0.5 text-[10px] text-[var(--color-accent)]">
                          Grouped
                        </span>
                      ) : null}
                      {header.column.getCanResize() ? (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-[var(--color-accent)]/30"
                        />
                      ) : null}
                    </th>
                  );
                })}

                {/* Add property button */}
                <th className="relative bg-[var(--color-surface)] w-10 px-2 py-2.5" ref={addPropRef}>
                  <button
                    type="button"
                    onClick={openAddProp}
                    className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                    title="속성 추가"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  {/* Add property popover */}
                  {showAddProp && (
                    <>
                      <div className="fixed inset-0 z-[99998]" onClick={() => setShowAddProp(false)} />
                      <div className="absolute right-0 top-full z-[99999] mt-1 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--color-text-primary)]">속성 추가</span>
                          <button type="button" onClick={() => setShowAddProp(false)}>
                            <X className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                          </button>
                        </div>

                        <input
                          ref={nameInputRef}
                          name="new-property-name"
                          type="text"
                          value={newPropName}
                          onChange={(e) => setNewPropName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && confirmAddProp()}
                          placeholder="속성 이름"
                          className="mb-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-placeholder)]"
                        />

                        <div className="mb-3 grid grid-cols-2 gap-1">
                          {ADDABLE_TYPES.map((type) => {
                            const iconName = getPropertyTypeIcon(type);
                            const Icon = (LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType) ?? LucideIcons.HelpCircle;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setNewPropType(type)}
                                className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition ${newPropType === type ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"}`}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                {getPropertyTypeLabel(type)}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={confirmAddProp}
                          className="w-full rounded bg-[var(--color-accent)] py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] transition"
                        >
                          추가
                        </button>
                      </div>
                    </>
                  )}
                </th>
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={(event) => handleRowClick(event, row)}
                className={`group border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-hover)] ${
                  onOpenRow && !row.getIsGrouped() ? "cursor-pointer" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => {
                  const isTitleColumn = cell.column.id === "title";
                  const occupancyKey = `${row.original.id}:${cell.column.id}`;
                  const occupyingUsers = occupiedCells.get(occupancyKey) ?? [];
                  const primaryOccupant = occupyingUsers[0];
                  return (
                    <td
                      key={cell.id}
                      data-testid={`db-cell-${row.original.id}-${cell.column.id}`}
                      onFocusCapture={() => handleCellEnter(row.original.id, cell.column.id)}
                      onClick={() => handleCellEnter(row.original.id, cell.column.id)}
                      onBlurCapture={(event) =>
                        handleCellLeave(event, row.original.id, cell.column.id)
                      }
                      title={occupyingUsers.map((user) => user.userName).join(", ") || undefined}
                      className={`border-r border-[var(--color-border)] px-3 py-1.5 ${
                        isTitleColumn
                          ? "sticky left-0 z-10 bg-[var(--color-background)] px-4 py-2 transition-colors group-hover:bg-[var(--color-hover)]"
                          : ""
                      }`}
                      style={
                        {
                          ...(row.depth > 0 && isTitleColumn
                            ? { paddingLeft: `${16 + row.depth * 20}px` }
                            : undefined),
                          ...(primaryOccupant
                            ? {
                                boxShadow: `inset 0 0 0 2px ${primaryOccupant.color}`,
                              }
                            : undefined),
                        }
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
                <td />
              </tr>
            ))}

            {/* New row */}
            <tr>
              <td colSpan={table.getVisibleLeafColumns().length + 1} className="px-4 py-2">
                <button
                  type="button"
                  onClick={onCreateRow}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
