"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteLogo } from "@/components/branding/SiteLogo";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or is invalid.";
      case "OAuthSignin":
        return "Error in the OAuth sign-in process.";
      case "OAuthCallback":
        return "Error in the OAuth callback process.";
      case "OAuthCreateAccount":
        return "Could not create OAuth account.";
      case "EmailCreateAccount":
        return "Could not create email account.";
      case "Callback":
        return "Error in the callback handler.";
      case "OAuthAccountNotLinked":
        return "This email is already associated with another account.";
      case "EmailSignin":
        return "Error sending the email sign-in link.";
      case "CredentialsSignin":
        return "Invalid credentials.";
      case "SessionRequired":
        return "You must be signed in to access this page.";
      default:
        return "An unknown error occurred during authentication.";
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-10 flex justify-center">
        <SiteLogo className="h-auto w-[180px]" priority />
      </div>

      {/* Error Card */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center text-xl font-semibold text-[var(--color-text-primary)]">
          Authentication Error
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--color-text-secondary)]">
          {getErrorMessage(error)}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="flex w-full items-center justify-center rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--color-background)] px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm">
          <div className="mb-10 flex justify-center">
            <SiteLogo className="h-auto w-[180px]" priority />
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-center text-xl font-semibold text-[var(--color-text-primary)]">
              Authentication Error
            </h1>
            <p className="mb-6 text-center text-sm text-[var(--color-text-secondary)]">
              Loading...
            </p>
          </div>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
