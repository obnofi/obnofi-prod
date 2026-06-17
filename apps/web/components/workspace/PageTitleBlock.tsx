"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface PageTitleBlockProps {
  value: string;
  onChange: (value: string) => void;
  commitOnBlur?: boolean;
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
  commitOnBlur = false,
  placeholder = "Untitled",
  size = "page",
  testId,
}: PageTitleBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFocusedRef = useRef(false);
  const isComposingRef = useRef(false);
  const lastReportedValueRef = useRef(value);
  const [draftValue, setDraftValue] = useState(value);
  
  // 고유한 id 생성 (testId이 있으면 사용, 없으면 랜덤)
  const id = useMemo(() => testId || `page-title-${Math.random().toString(36).slice(2, 9)}`, [testId]);

  const reportValue = (nextValue: string) => {
    if (lastReportedValueRef.current === nextValue) {
      return;
    }

    lastReportedValueRef.current = nextValue;
    onChange(nextValue);
  };

  // textarea auto-resize - 초기 마운트 시에만 높이 조정
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;

    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 값이 변경될 때 높이 조정 (스크롤 방해 방지)
  useEffect(() => {
    const node = textareaRef.current;
    if (!node || !isFocusedRef.current) return;

    // 현재 커서 위치 저장
    const selectionStart = node.selectionStart;
    const selectionEnd = node.selectionEnd;

    // 높이 조정
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;

    // 커서 위치 복원 (높이 조정으로 인한 포커스 손실 방지)
    node.selectionStart = selectionStart;
    node.selectionEnd = selectionEnd;
  }, [draftValue]);

  useEffect(() => {
    if (isFocusedRef.current || isComposingRef.current) {
      return;
    }

    setDraftValue(value);
    lastReportedValueRef.current = value;
  }, [value]);

  return (
    <div className="mb-6">
      <textarea
        ref={textareaRef}
        id={id}
        name="page-title"
        rows={1}
        value={draftValue}
        placeholder={placeholder}
        data-testid={testId}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          reportValue(draftValue);
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          isComposingRef.current = false;
          const nextValue = event.currentTarget.value;
          setDraftValue(nextValue);
          if (!commitOnBlur) {
            reportValue(nextValue);
          }
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);
          if (!commitOnBlur) {
            reportValue(nextValue);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`grove-page-title-block w-full resize-none overflow-hidden rounded-xl border border-transparent bg-transparent px-3 py-2 font-bold text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] ${sizeClasses[size]}`}
      />
    </div>
  );
}
