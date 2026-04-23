"use client";

import { useState, useMemo } from "react";
import { Search, RotateCcw, Command, Keyboard } from "lucide-react";

// Reusable Components
function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2";

  const variants = {
    primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
    secondary:
      "bg-[var(--color-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-selected)] border border-[var(--color-border)]",
    ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-6 text-sm",
  };

  return (
    <button type="button" onClick={onClick} className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-0.5 text-xs font-mono text-[var(--color-text-primary)] shadow-sm">
      {children}
    </kbd>
  );
}

interface Shortcut {
  action: string;
  keys: string[];
  category: string;
}

const shortcuts: Shortcut[] = [
  // General
  { action: "Quick search", keys: ["Cmd", "K"], category: "General" },
  { action: "Command palette", keys: ["Cmd", "Shift", "P"], category: "General" },
  { action: "New page", keys: ["Cmd", "N"], category: "General" },
  { action: "Save", keys: ["Cmd", "S"], category: "General" },
  { action: "Undo", keys: ["Cmd", "Z"], category: "General" },
  { action: "Redo", keys: ["Cmd", "Shift", "Z"], category: "General" },

  // Navigation
  { action: "Go back", keys: ["Cmd", "["], category: "Navigation" },
  { action: "Go forward", keys: ["Cmd", "]"], category: "Navigation" },
  { action: "Go to workspace", keys: ["Cmd", "1"], category: "Navigation" },
  { action: "Go to graph view", keys: ["Cmd", "2"], category: "Navigation" },
  { action: "Go to canvas", keys: ["Cmd", "3"], category: "Navigation" },

  // Editor
  { action: "Bold", keys: ["Cmd", "B"], category: "Editor" },
  { action: "Italic", keys: ["Cmd", "I"], category: "Editor" },
  { action: "Underline", keys: ["Cmd", "U"], category: "Editor" },
  { action: "Strikethrough", keys: ["Cmd", "Shift", "S"], category: "Editor" },
  { action: "Code", keys: ["Cmd", "E"], category: "Editor" },
  { action: "Link", keys: ["Cmd", "K"], category: "Editor" },
  { action: "Heading 1", keys: ["Cmd", "Alt", "1"], category: "Editor" },
  { action: "Heading 2", keys: ["Cmd", "Alt", "2"], category: "Editor" },
  { action: "Heading 3", keys: ["Cmd", "Alt", "3"], category: "Editor" },
  { action: "Bullet list", keys: ["Cmd", "Shift", "8"], category: "Editor" },
  { action: "Numbered list", keys: ["Cmd", "Shift", "7"], category: "Editor" },
  { action: "Todo list", keys: ["Cmd", "Shift", "4"], category: "Editor" },
  { action: "Quote", keys: ["Cmd", "Shift", "9"], category: "Editor" },
  { action: "Divider", keys: ["Cmd", "Shift", "-"], category: "Editor" },

  // Canvas
  { action: "Pan canvas", keys: ["Space", "+ drag"], category: "Canvas" },
  { action: "Zoom in", keys: ["Cmd", "+"], category: "Canvas" },
  { action: "Zoom out", keys: ["Cmd", "-"], category: "Canvas" },
  { action: "Reset zoom", keys: ["Cmd", "0"], category: "Canvas" },
  { action: "Select all", keys: ["Cmd", "A"], category: "Canvas" },
  { action: "Delete selection", keys: ["Delete"], category: "Canvas" },
  { action: "Duplicate", keys: ["Cmd", "D"], category: "Canvas" },
  { action: "Group", keys: ["Cmd", "G"], category: "Canvas" },
  { action: "Ungroup", keys: ["Cmd", "Shift", "G"], category: "Canvas" },

  // Database
  { action: "New row", keys: ["Cmd", "Enter"], category: "Database" },
  { action: "Delete row", keys: ["Cmd", "Shift", "Delete"], category: "Database" },
  { action: "Filter", keys: ["Cmd", "Shift", "F"], category: "Database" },
  { action: "Sort", keys: ["Cmd", "Shift", "S"], category: "Database" },
];

// Shortcuts Settings Page
export default function ShortcutsSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;
    const query = searchQuery.toLowerCase();
    return shortcuts.filter(
      (s) =>
        s.action.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.keys.some((k) => k.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, Shortcut[]> = {};
    filteredShortcuts.forEach((shortcut) => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });
    return groups;
  }, [filteredShortcuts]);

  const handleReset = () => {
    if (confirm("Reset all keyboard shortcuts to defaults?")) {
      // TODO: Reset shortcuts
      alert("Shortcuts reset to defaults");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Keyboard Shortcuts</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          View and customize keyboard shortcuts for faster navigation.
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to defaults
        </Button>
      </div>

      {/* Shortcuts Table */}
      <div className="space-y-8">
        {Object.entries(groupedShortcuts).map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              {category}
            </h3>
            <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
              <table className="w-full">
                <tbody className="divide-y divide-[var(--color-border)]">
                  {items.map((shortcut, index) => (
                    <tr
                      key={`${shortcut.action}-${index}`}
                      className="bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-hover)]"
                    >
                      <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                        {shortcut.action}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center">
                              <Kbd>{key}</Kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-[var(--color-text-secondary)]">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredShortcuts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-12">
            <Keyboard className="h-12 w-12 text-[var(--color-text-placeholder)]" />
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
              No shortcuts found matching &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
