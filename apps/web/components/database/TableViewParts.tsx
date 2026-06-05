"use client";

import React, { useRef, useState } from "react";
import { flexRender, type HeaderGroup } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Property, Page, PropertyType, SelectOption } from "@obnofi/types";
import { getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/database-utils";
import { PropertyHeader } from "./PropertyHeader";

// ---------------------------------------------------------------------------
// ADDABLE_TYPES — shared constant
// ---------------------------------------------------------------------------

export const ADDABLE_TYPES: PropertyType[] = [
  "text", "number", "select", "multi_select", "date", "checkbox", "url", "email", "phone", "status",
];

// ---------------------------------------------------------------------------
// AddPropertyPopover
// ---------------------------------------------------------------------------

interface AddPropertyPopoverProps {
  onConfirm: (name: string, type: PropertyType) => void;
  onClose: () => void;
}

export function AddPropertyPopover({ onConfirm, onClose }: AddPropertyPopoverProps) {
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState<PropertyType>("text");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const confirm = () => {
    const name = newPropName.trim() || getPropertyTypeLabel(newPropType);
    onConfirm(name, newPropType);
  };

  return (
    <>
      <div className="fixed inset-0 z-[99998]" onClick={onClose} />
      <div className="absolute right-0 top-full z-[99999] mt-1 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">속성 추가</span>
          <button type="button" onClick={onClose}>
            <X className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <input
          ref={nameInputRef}
          name="new-property-name"
          type="text"
          value={newPropName}
          onChange={(e) => setNewPropName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirm()}
          placeholder="속성 이름"
          className="mb-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-placeholder)]"
        />

        <div className="mb-3 grid grid-cols-2 gap-1">
          {ADDABLE_TYPES.map((type) => {
            const iconName = getPropertyTypeIcon(type);
            const Icon =
              (LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType) ??
              LucideIcons.HelpCircle;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setNewPropType(type)}
                className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition ${
                  newPropType === type
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {getPropertyTypeLabel(type)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={confirm}
          className="w-full rounded-md bg-[var(--color-accent)] py-1.5 text-xs font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          추가
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// TableHead
// ---------------------------------------------------------------------------

interface TableHeadProps {
  headerGroups: HeaderGroup<Page>[];
  properties: Property[];
  compact: boolean;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  onUpdateProperty?: (
    propertyId: string,
    updates: { name?: string; type?: PropertyType; options?: SelectOption[] }
  ) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onMoveProperty?: (propertyId: string, direction: "left" | "right") => void;
}

export function TableHead({
  headerGroups,
  properties,
  compact,
  onCreateProperty,
  onUpdateProperty,
  onDeleteProperty,
  onMoveProperty,
}: TableHeadProps) {
  const addPropRef = useRef<HTMLTableCellElement>(null);
  const [showAddProp, setShowAddProp] = useState(false);

  const openAddProp = () => {
    setShowAddProp(true);
    // Small delay to let the popover mount before focusing the input inside it
    setTimeout(() => {
      const input = addPropRef.current?.querySelector<HTMLInputElement>("input");
      input?.focus();
    }, 50);
  };

  const handleConfirmAddProp = (name: string, type: PropertyType) => {
    onCreateProperty?.(name, type);
    setShowAddProp(false);
  };

  return (
    <thead>
      {headerGroups.map((headerGroup) => (
        <tr
          key={headerGroup.id}
          className="border-b border-[var(--color-border)]"
        >
          {headerGroup.headers.map((header) => {
            const isTitleColumn = header.column.id === "title";
            const isGrouped = header.column.getIsGrouped();
            if (header.isPlaceholder) return null;

            const property = !isTitleColumn
              ? properties.find((p) => p.id === header.column.id)
              : null;

            return (
              <th
                key={header.id}
                className={`relative border-r border-[var(--color-border)] bg-[var(--color-surface)] px-0 py-0 text-left ${
                  isTitleColumn
                    ? `sticky left-0 z-20 ${compact ? "w-48" : "w-64"} px-3 py-2 text-[11px] font-medium text-[var(--color-text-secondary)]`
                    : compact
                    ? "w-32 min-w-[7rem]"
                    : "w-40 min-w-[9rem]"
                }`}
              >
                {isTitleColumn ? (
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium hover:text-[var(--color-text-primary)]"
                  >
                    <span>
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
                    canMoveRight={property.order < properties.length - 1}
                  />
                ) : (
                  <span className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
          <th
            className="relative w-10 bg-[var(--color-surface)] px-2 py-2"
            ref={addPropRef}
          >
            <button
              type="button"
              onClick={openAddProp}
              className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              title="속성 추가"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            {showAddProp && (
              <AddPropertyPopover
                onConfirm={handleConfirmAddProp}
                onClose={() => setShowAddProp(false)}
              />
            )}
          </th>
        </tr>
      ))}
    </thead>
  );
}
