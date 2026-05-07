"use client";

import Link from "next/link";
import { Suspense, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { SiteLogo } from "@/components/branding/SiteLogo";

const DEFAULT_CALLBACK = "/workspace";

function SignInContent() {
  const searchParams = useSearchParams();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [isDevPending] = useTransition();
  // NextAuth가 callbackUrl을 query에 포함시켜 이 페이지로 보냄.
  // CLI auth 흐름 등 동적 redirect를 위해 읽어서 signIn에 전달.
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;
  const isCliFlow = searchParams.get("callbackUrl")?.includes("127.0.0.1") || searchParams.get("callbackUrl")?.includes("localhost");

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--color-background)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 34%)",
        }}
      />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,440px)] lg:items-center">
          <section className="max-w-xl">
            <SiteLogo className="h-auto w-[168px] sm:w-[188px]" priority />
            <div className="mt-8">
              {isCliFlow ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
                  로컬 CLI 연결
                </div>
              ) : null}
              <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-5xl">
                흐름을 끊지 않고 바로 작업을 이어가세요.
              </h1>
              <p className="mt-4 max-w-[48ch] text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
                Obnofi는 문서, 데이터베이스, 그리고 Clearing 보드를 하나의 조용한 워크스페이스에 담습니다. 로그인하고 방금 멈춘 생각의 자리로 바로 돌아오세요.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Grove 에디터</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">방해 없는 화면에서 긴 글을 자연스럽게 이어갑니다.</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Undergrowth 뷰</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">표, 보드, 캘린더를 오가며 같은 정보를 다르게 봅니다.</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Clearing 캔버스</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">텍스트만으로 부족할 때 생각을 공간 위에 펼쳐놓습니다.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-[var(--color-surface)] p-6 sm:p-8">
            <p className="text-sm font-medium text-[var(--color-accent)]">인증</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">
              워크스페이스로 계속하기
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              일반 사용은 Google 로그인을 사용하고, 로컬 개발을 위한 dev 모드도 그대로 유지됩니다.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() =>
                  startGoogleTransition(() => {
                    void signIn("google", { callbackUrl });
                  })
                }
                disabled={isGooglePending || isDevPending}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--color-background)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-hover)] disabled:cursor-wait disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isGooglePending ? "Google에 연결하는 중..." : "Google로 계속하기"}
              </button>
            </div>

            <div className="mt-8 rounded-2xl bg-[var(--color-background)] px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                안내
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                <li>Google 로그인은 같은 계정의 워크스페이스 세션으로 연결됩니다.</li>
                <li>dev 모드는 로컬 개발 환경에서만 사용하는 것을 전제로 합니다.</li>
                <li>CLI 승인 흐름은 로그인 후 이 페이지로 자동 복귀합니다.</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 text-sm text-[var(--color-text-secondary)]">
              <Link href="/" className="transition-colors hover:text-[var(--color-text-primary)]">
                홈으로 돌아가기
              </Link>
              <p className="max-w-[24ch] text-right text-xs leading-5">
                로그인하면 서비스 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// useSearchParams()는 Suspense boundary 필요
export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
