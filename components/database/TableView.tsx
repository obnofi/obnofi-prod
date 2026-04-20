"use client";

import React, { useRef, useState } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Property, Page, PropertyType } from "@/types";
import { getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/database-utils";

interface TableViewProps {
  table: Table<Page>;
  properties: Property[];
  onCreateRow?: () => void;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  compact?: boolean;
}

const ADDABLE_TYPES: PropertyType[] = [
  "text", "number", "select", "multi_select", "date", "checkbox", "url", "email", "phone", "status",
];

export function TableView({
  table,
  properties: _properties,
  onCreateRow,
  onCreateProperty,
  compact = false,
}: TableViewProps) {
  const [showAddProp, setShowAddProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState<PropertyType>("text");
  const addPropRef = useRef<HTMLTableCellElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

                  return (
                    <th
                      key={header.id}
                      className={`relative bg-[var(--color-surface)] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)] border-r border-[var(--color-border)] ${
                        isTitleColumn
                          ? `sticky left-0 z-10 ${compact ? "w-48" : "w-64"}`
                          : compact
                          ? "w-32 min-w-[7rem]"
                          : "w-40 min-w-[9rem]"
                      }`}
                    >
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
                className="group border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-hover)]"
              >
                {row.getVisibleCells().map((cell) => {
                  const isTitleColumn = cell.column.id === "title";
                  return (
                    <td
                      key={cell.id}
                      className={`border-r border-[var(--color-border)] px-3 py-1.5 ${
                        isTitleColumn
                          ? "sticky left-0 z-10 bg-[var(--color-background)] px-4 py-2"
                          : ""
                      }`}
                      style={
                        row.depth > 0 && isTitleColumn
                          ? { paddingLeft: `${16 + row.depth * 20}px` }
                          : undefined
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
