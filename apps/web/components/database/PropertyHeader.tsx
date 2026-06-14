"use client";

import { useState, useRef } from "react";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Settings,
  GripVertical,
  X,
} from "lucide-react";
import { Property, PropertyType, SelectOption } from "@obnofi/types";
import { PropertyTypeSelector } from "./PropertyTypeSelector";
import { PropertyOptionsEditor } from "./PropertyOptionsEditor";
import { DropdownPortal } from "./DropdownPortal";
import {
  getPropertyTypeLabel,
  requiresOptions,
} from "@/lib/database-utils";

interface PropertyHeaderProps {
  property: Property;
  onRename: (name: string) => void;
  onChangeType: (type: PropertyType) => void;
  onUpdateOptions: (options: SelectOption[]) => void;
  onDelete: () => void;
  onMove?: (direction: "left" | "right") => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
}

export function PropertyHeader({
  property,
  onRename,
  onChangeType,
  onUpdateOptions,
  onDelete,
  onMove,
  canMoveLeft = true,
  canMoveRight = true,
}: PropertyHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [nameValue, setNameValue] = useState(property.name);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const handleNameSubmit = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== property.name) {
      onRename(trimmed);
    }
    setIsEditingName(false);
  };

  return (
    <div className="group relative h-full">
      <div className="flex h-full items-center justify-between gap-2 px-3 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-placeholder)]" />
          <div className="flex min-w-0 flex-col gap-0.5">
            {isEditingName ? (
              <input
                name="property-name"
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSubmit();
                  if (e.key === "Escape") {
                    setNameValue(property.name);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-0.5 text-sm font-medium text-[var(--color-text-primary)] outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="truncate text-left text-[13px] font-medium text-[var(--color-text-primary)]"
                title={property.name}
              >
                {property.name}
              </button>
            )}
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              {getPropertyTypeLabel(property.type)}
            </span>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            ref={menuTriggerRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={`Open ${property.name} property menu`}
            className="rounded-md p-1 opacity-0 transition hover:bg-[var(--color-hover)] group-hover:opacity-100 focus:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>

          <DropdownPortal
            triggerRef={menuTriggerRef}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            align="right"
          >
            <div className="w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
              <div className="border-b border-[var(--color-border)] px-3 py-2">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Property type
                </span>
                <div className="mt-2">
                  <PropertyTypeSelector
                    value={property.type}
                    onChange={(type) => {
                      onChangeType(type);
                      setIsMenuOpen(false);
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditingName(true);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
              >
                <Edit2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
                Rename
              </button>

              {requiresOptions(property.type) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingOptions(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                >
                  <Settings className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  Edit options
                </button>
              )}

              {onMove && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onMove("left");
                      setIsMenuOpen(false);
                    }}
                    disabled={!canMoveLeft}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    Move left
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onMove("right");
                      setIsMenuOpen(false);
                    }}
                    disabled={!canMoveRight}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] disabled:opacity-50"
                  >
                    <ArrowRight className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    Move right
                  </button>
                </>
              )}

              <div className="border-t border-[var(--color-border)]" />

              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete property
              </button>
            </div>
          </DropdownPortal>
        </div>
      </div>

      {/* Options Editor Modal */}
      {isEditingOptions && requiresOptions(property.type) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
                Edit options for &quot;{property.name}&quot;
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingOptions(false)}
                aria-label="Close property options"
                className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <PropertyOptionsEditor
              options={property.options || []}
              onChange={(options) => {
                onUpdateOptions(options);
              }}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditingOptions(false)}
                className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
