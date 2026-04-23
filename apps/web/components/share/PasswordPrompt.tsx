"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PageData {
  id: string;
  title: string;
  content: object | null;
  updatedAt: string;
}

interface PasswordPromptProps {
  shareId: string;
  onSuccessAction: string;
}

export function PasswordPrompt({ shareId, onSuccessAction }: PasswordPromptProps) {
  const handleSuccess = (data: PageData) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent(onSuccessAction, { detail: data });
      window.dispatchEvent(event);
    }
  };
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
        const data = await response.json();
        handleSuccess(data);
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
    <div className="min-h-screen bg-white dark:bg-[#111110] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#111110] dark:text-zinc-100 mb-2">
            This page is password protected
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter the password to view this page
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 pr-12 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D45]/20 focus:border-[#2E7D45] text-[#111110] dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
