"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { PropertyType } from "@obnofi/types";
import { BASIC_PROPERTY_TYPES, getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/database-utils";

interface AddPropertyPopoverProps {
  onAdd: (name: string, type: PropertyType) => void;
}

export function AddPropertyPopover({ onAdd }: AddPropertyPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("text");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    setName("");
    setType("text");
    setIsOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const confirm = () => {
    const finalName = name.trim() || getPropertyTypeLabel(type);
    onAdd(finalName, type);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        속성 추가
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[99998]" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-[99999] mt-1 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">속성 추가</span>
              <button type="button" onClick={() => setIsOpen(false)}>
                <X className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
              placeholder="속성 이름"
              className="mb-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-placeholder)]"
            />

            <div className="mb-3 grid grid-cols-2 gap-1">
              {BASIC_PROPERTY_TYPES.map((t) => {
                const iconName = getPropertyTypeIcon(t);
                const Icon = (LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType) ?? LucideIcons.HelpCircle;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition ${
                      type === t
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {getPropertyTypeLabel(t)}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={confirm}
              className="w-full rounded bg-[var(--color-accent)] py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] transition"
            >
              추가
            </button>
          </div>
        </>
      )}
    </div>
  );
}
