"use client";

import { useState, useRef, useEffect } from "react";
import {
  Type,
  Hash,
  List,
  ListChecks,
  Kanban,
  Calendar,
  User,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Paperclip,
  ArrowLeftRight,
  Calculator,
  FunctionSquare,
  Clock,
  UserPlus,
  Edit3,
  Search,
  ChevronDown,
} from "lucide-react";
import { PropertyType } from "@obnofi/types/database";
import { getPropertyTypeLabel, BASIC_PROPERTY_TYPES } from "@/lib/property-utils";

interface PropertyTypeSelectorProps {
  value: PropertyType;
  onChange: (type: PropertyType) => void;
  disabled?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Hash,
  List,
  ListChecks,
  Kanban,
  Calendar,
  User,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Paperclip,
  ArrowLeftRight,
  Calculator,
  FunctionSquare,
  Clock,
  UserPlus,
  Edit3,
};

const typeCategories = {
  basic: {
    label: "Basic",
    types: BASIC_PROPERTY_TYPES,
  },
  advanced: {
    label: "Advanced",
    types: ["relation", "rollup", "formula"] as PropertyType[],
  },
  computed: {
    label: "Computed",
    types: [
      "created_time",
      "created_by",
      "last_edited_time",
      "last_edited_by",
    ] as PropertyType[],
  },
};

function getIconForType(type: PropertyType) {
  switch (type) {
    case "text":
      return Type;
    case "number":
      return Hash;
    case "select":
      return List;
    case "multi_select":
      return ListChecks;
    case "status":
      return Kanban;
    case "date":
      return Calendar;
    case "person":
      return User;
    case "checkbox":
      return CheckSquare;
    case "url":
      return Link;
    case "email":
      return Mail;
    case "phone":
      return Phone;
    case "files":
      return Paperclip;
    case "relation":
      return ArrowLeftRight;
    case "rollup":
      return Calculator;
    case "formula":
      return FunctionSquare;
    case "created_time":
    case "last_edited_time":
      return Clock;
    case "created_by":
      return UserPlus;
    case "last_edited_by":
      return Edit3;
    default:
      return Type;
  }
}

export function PropertyTypeSelector({
  value,
  onChange,
  disabled = false,
}: PropertyTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const SelectedIcon = getIconForType(value);

  const filteredTypes = (types: PropertyType[]) => {
    if (!searchQuery) return types;
    const query = searchQuery.toLowerCase();
    return types.filter((type) =>
      getPropertyTypeLabel(type).toLowerCase().includes(query)
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-[#111110] transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <SelectedIcon className="h-4 w-4 text-zinc-500" />
        <span>{getPropertyTypeLabel(value)}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[99999] mt-1 w-64 rounded-lg border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-800">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search types..."
                className="w-full bg-transparent text-sm text-[#111110] outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-auto">
            {Object.entries(typeCategories).map(([category, { label, types }]) => {
              const filtered = filteredTypes(types);
              if (filtered.length === 0) return null;

              return (
                <div key={category}>
                  <div className="px-3 py-1.5 text-xs font-medium text-zinc-400">
                    {label}
                  </div>
                  {filtered.map((type) => {
                    const Icon = getIconForType(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          onChange(type);
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Icon className="h-4 w-4 text-zinc-500" />
                        <span className="text-[#111110] dark:text-zinc-100">
                          {getPropertyTypeLabel(type)}
                        </span>
                        {value === type && (
                          <span className="ml-auto text-[#2E7D45]">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
