import Link from "next/link";
import { Compass, Leaf, Trees } from "lucide-react";
import { SiteLogo } from "@/components/branding/SiteLogo";

interface ForestShellProps {
  currentSection: "forest" | "snapshot";
  children: React.ReactNode;
}

function shellLinkClassName(isActive: boolean) {
  return `flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ${
    isActive
      ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
  }`;
}

export function ForestShell({
  currentSection,
  children,
}: ForestShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] md:flex">
      <aside
        className="hidden shrink-0 bg-[var(--color-surface)] md:flex md:w-[240px] md:flex-col"
        style={{ borderRight: "1px solid var(--color-border)" }}
      >
        <div className="px-4 py-5">
          <Link href="/" className="inline-flex items-center">
            <SiteLogo width={108} />
          </Link>
        </div>

        <div className="px-3">
          <nav className="flex flex-col gap-0.5">
            <Link
              href="/forest"
              className={shellLinkClassName(currentSection === "forest")}
            >
              <Trees className="h-4 w-4" />
              <span>Forest</span>
            </Link>
            <Link
              href="/workspace"
              className={shellLinkClassName(false)}
            >
              <Compass className="h-4 w-4" />
              <span>Workspace</span>
            </Link>
            <div className={shellLinkClassName(currentSection === "snapshot")}>
              <Leaf className="h-4 w-4" />
              <span>Snapshot</span>
            </div>
          </nav>
        </div>

        <div className="mt-8 px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-placeholder)]">
            Forest
          </p>
          <p className="mt-3 max-w-[22ch] text-[13px] leading-6 text-[var(--color-text-secondary)]">
            Forest는 원본과 분리된 읽기 전용 fossil snapshot을 둘러보는 공간입니다.
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div
          className="flex items-center justify-between px-6 py-4 md:hidden"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <Link href="/" className="inline-flex items-center">
            <SiteLogo width={96} />
          </Link>
          <Link
            href="/forest"
            className="rounded-md px-2 py-1 text-[13px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
          >
            Forest
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
