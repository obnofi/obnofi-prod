import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { SiteLogo } from "@/components/branding/SiteLogo";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // 로그인된 사용자는 워크스페이스로 리다이렉트
  if (session?.user) {
    redirect("/workspace");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-background)]">
      <main className="flex flex-col items-center justify-center gap-6 px-4 text-center">
        <SiteLogo
          priority
          className="h-auto w-[220px] sm:w-[280px]"
        />
        <p className="max-w-2xl text-lg text-[var(--color-text-secondary)]">
          A Notion-like workspace with publishing. Create, edit, and share your
          pages with unique URLs, or open the Clearing board for a FigJam-style
          collaboration surface.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/signin"
            className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Get Started
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)]"
          >
            Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
