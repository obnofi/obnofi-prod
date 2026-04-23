"use client";

import { useState, useCallback } from "react";
import { Link, ExternalLink } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface UrlCellProps {
  value: string;
  onChange: (value: string) => void;
}

export function UrlCell({ value, onChange }: UrlCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedOnChange = useDebounce(onChange, 300);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const normalizedUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const displayUrl = (url: string): string => {
    if (!url) return "";
    try {
      const urlObj = new URL(normalizedUrl(url));
      return urlObj.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  if (!isFocused && value) {
    return (
      <a
        href={normalizedUrl(value)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#2E7D45] hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{displayUrl(value)}</span>
      </a>
    );
  }

  return (
    <div className="relative flex items-center">
      <Link className="absolute left-2 h-3.5 w-3.5 text-zinc-400" />
      <input
        type="url"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="https://..."
        className="w-full rounded-md border border-transparent bg-transparent pl-7 pr-2 py-1.5 text-sm text-[#111110] outline-none transition focus:border-zinc-300 focus:bg-white dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
      />
    </div>
  );
}
