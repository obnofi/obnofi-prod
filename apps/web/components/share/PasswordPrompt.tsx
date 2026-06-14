"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordPromptProps {
  shareId: string;
  onSuccess: (page: {
    id: string;
    workspaceId: string;
    title: string;
    icon: string | null;
    coverImage: string | null;
    content: object | null;
    updatedAt: string;
    isPasswordProtected: boolean;
  }) => void;
}

export function PasswordPrompt({ shareId, onSuccess }: PasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/public/pages/${shareId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onSuccess(await response.json());
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            This page is password protected
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Enter the password to view this page
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              name="page-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 pr-12 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D45]/20 focus:border-[#2E7D45] text-[var(--color-text-primary)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 text-sm font-medium text-white bg-[#2E7D45] rounded-lg hover:bg-[#256a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Verifying..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
