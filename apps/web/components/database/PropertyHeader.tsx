"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings,
} from "lucide-react";
import { Property, PropertyType, SelectOption } from "@obnofi/types";
import { PropertyTypeSelector } from "./PropertyTypeSelector";
import { PropertyOptionsEditor } from "./PropertyOptionsEditor";
import {
  getPropertyTypeIcon,
  getPropertyTypeLabel,
  requiresOptions,
} from "@/lib/database-utils";
import * as LucideIcons from "lucide-react";

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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameSubmit = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== property.name) {
      onRename(trimmed);
    }
    setIsEditingName(false);
  };

  const IconComponent =
    (LucideIcons[getPropertyTypeIcon(property.type) as keyof typeof LucideIcons] as
      React.ComponentType<{ className?: string }>) || LucideIcons.HelpCircle;

  return (
    <div className="group relative h-full">
      <div className="flex h-full items-center justify-between px-3 py-2">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {isEditingName ? (
            <input
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
              className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-0.5 text-sm font-medium text-[var(--color-text-primary)] outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-left text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] truncate"
              title={property.name}
            >
              {property.name}
            </button>
          )}
          <span className="text-[10px] text-[var(--color-text-secondary)]">
            {getPropertyTypeLabel(property.type)}
          </span>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded p-1 opacity-0 transition hover:bg-[var(--color-hover)] group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full z-[99999] mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
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
                    onClick={() => {
                      onMove("left");
                      setIsMenuOpen(false);
                    }}
                    disabled={!canMoveLeft}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] disabled:opacity-50"
                  >
                    <ArrowUp className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    Move left
                  </button>
                  <button
                    onClick={() => {
                      onMove("right");
                      setIsMenuOpen(false);
                    }}
                    disabled={!canMoveRight}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] disabled:opacity-50"
                  >
                    <ArrowDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    Move right
                  </button>
                </>
              )}

              <div className="border-t border-[var(--color-border)]" />

              <button
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
          )}
        </div>
      </div>

      {/* Options Editor Modal */}
      {isEditingOptions && requiresOptions(property.type) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
                Edit options for "{property.name}"
              </h3>
              <button
                onClick={() => setIsEditingOptions(false)}
                className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              >
                ✕
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
