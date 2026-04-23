"use client";

import { useState } from "react";
import {
  User,
  Palette,
  Type,
  LayoutGrid,
  Bot,
  Keyboard,
  Download,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { id: "account", label: "My Account", icon: <User className="h-4 w-4" />, href: "/settings" },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" />, href: "/settings/appearance" },
  { id: "editor", label: "Editor", icon: <Type className="h-4 w-4" />, href: "/settings/editor" },
  { id: "canvas", label: "Canvas", icon: <LayoutGrid className="h-4 w-4" />, href: "/settings/canvas" },
  { id: "ai", label: "AI", icon: <Bot className="h-4 w-4" />, href: "/settings/ai" },
  { id: "shortcuts", label: "Shortcuts", icon: <Keyboard className="h-4 w-4" />, href: "/settings/shortcuts" },
  { id: "import-export", label: "Import / Export", icon: <Download className="h-4 w-4" />, href: "/settings/import-export" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings" || pathname === "/settings/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--color-background)]">
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-sm lg:hidden"
        aria-label="Toggle settings menu"
      >
        <ChevronRight className={`h-5 w-5 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] transform border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 ease-in-out lg:static lg:transform-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center border-b border-[var(--color-border)] px-4">
            <Link
              href="/"
              className="text-lg font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
            >
              ← Back to Workspace
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3">
              <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                Settings
              </div>
              <ul className="space-y-0.5">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive(item.href)
                          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      <span className={isActive(item.href) ? "text-[var(--color-accent)]" : ""}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--color-border)] p-4">
            <div className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-medium text-[var(--color-text-primary)]">obnofi</span> v0.1.0
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pl-0">
        <div className="mx-auto max-w-3xl px-6 py-12 lg:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
