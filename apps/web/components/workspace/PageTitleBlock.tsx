"use client";

import { useEffect, useRef } from "react";

interface PageTitleBlockProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "page" | "side-tab";
  testId?: string;
}

const sizeClasses: Record<NonNullable<PageTitleBlockProps["size"]>, string> = {
  page: "text-[40px]",
  "side-tab": "text-[34px]",
};

export function PageTitleBlock({
  value,
  onChange,
  placeholder = "Untitled",
  size = "page",
  testId,
}: PageTitleBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) {
      return;
    }

    node.style.height = "0px";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return (
    <div className="mb-6">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder={placeholder}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
        className={`grove-page-title-block w-full resize-none overflow-hidden rounded-xl border border-transparent bg-transparent px-3 py-2 font-bold text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] ${sizeClasses[size]}`}
      />
    </div>
  );
}
