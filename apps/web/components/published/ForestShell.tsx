import Link from "next/link";
import { SiteLogo } from "@/components/branding/SiteLogo";

interface ForestShellProps {
  currentSection: "forest" | "snapshot";
  children: React.ReactNode;
}

export function ForestShell({ currentSection, children }: ForestShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header
        className="sticky top-0 z-20 backdrop-blur-sm"
        style={{
          background: "color-mix(in srgb, var(--color-background) 90%, transparent)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex items-center">
              <SiteLogo width={96} />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/forest"
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium transition"
                style={{
                  color: currentSection === "forest" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  background: currentSection === "forest" ? "var(--color-hover)" : "transparent",
                }}
              >
                Forest
              </Link>
              <Link
                href="/workspace"
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium transition hover:bg-[var(--color-hover)]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Workspace
              </Link>
            </nav>
          </div>

          <Link
            href="/workspace"
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
            }}
          >
            Open Workspace
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
