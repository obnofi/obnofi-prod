"use client";

import { useState } from "react";
import { Share2, Copy, Check, Lock, Globe, Link2 } from "lucide-react";

interface SharePopoverProps {
  pageId: string;
  isPublic: boolean;
  shareId: string | null;
  onShareUpdateAction: string;
}

export function SharePopover({
  pageId,
  isPublic,
  shareId,
  onShareUpdateAction,
}: SharePopoverProps) {
  const handleShareUpdate = (isPublic: boolean, shareId: string | null) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent(onShareUpdateAction, { detail: { isPublic, shareId } });
      window.dispatchEvent(event);
    }
  };
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const shareUrl = shareId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareId}`
    : "";

  const handleToggleShare = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/pages/${pageId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublic: !isPublic,
          password: password || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        handleShareUpdate(data.isPublic, data.shareId);
        if (!data.isPublic) {
          setPassword("");
          setShowPasswordInput(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#111110] dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111110] dark:text-zinc-100">
                Share to web
              </h3>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isPublic ? "bg-[#2E7D45]" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                onClick={!isLoading ? handleToggleShare : undefined}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </div>

            {isPublic ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md">
                  <Globe className="w-4 h-4 text-[#2E7D45] mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      This page is published to the web
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
                    <Link2 className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      {shareUrl.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#2E7D45]" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <button
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#111110] dark:hover:text-zinc-200"
                  >
                    <Lock className="w-4 h-4" />
                    {showPasswordInput ? "Cancel" : "Set password"}
                  </button>

                  {showPasswordInput && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="flex-1 px-3 py-2 text-sm text-[#111110] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E7D45]/20 focus:border-[#2E7D45] dark:text-zinc-100"
                      />
                      <button
                        onClick={handleToggleShare}
                        disabled={isLoading || !password}
                        className="px-3 py-2 text-sm font-medium text-white bg-[#2E7D45] rounded-md hover:bg-[#256a3a] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Toggle on to publish this page to the web. Anyone with the link
                can view it.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
