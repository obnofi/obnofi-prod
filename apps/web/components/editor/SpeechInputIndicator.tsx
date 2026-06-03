"use client";

import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

interface SpeechInputIndicatorProps {
  isListening: boolean;
  interimTranscript: string;
  listeningState?: ParrotListeningState;
}

/** 녹음 중일 때 에디터 하단에 표시되는 실시간 interim 텍스트 패널 */
export function SpeechInputIndicator({
  isListening,
  interimTranscript,
  listeningState = "idle",
}: SpeechInputIndicatorProps) {
  if (!isListening) return null;

  const statusLabel =
    listeningState === "listening"
      ? "듣는 중"
      : listeningState === "resting"
        ? "쉬는 중"
        : "준비 중";

  return (
    <div
      data-export-ignore="true"
      role="status"
      aria-live="polite"
      aria-label="음성인식 결과 미리보기"
      className="mt-2 flex items-start gap-3 rounded-[22px] bg-[var(--color-accent-subtle)] px-4 py-3"
    >
      <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-30 parrot-orbit-pulse" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
        </span>
        <span className="text-xs font-medium text-[var(--color-accent)]">
          {statusLabel}
        </span>
      </div>

      <p className="min-h-[1.25rem] text-sm text-[var(--color-text-secondary)]">
        {interimTranscript || (
          <span className="text-[var(--color-text-placeholder)]">
            {listeningState === "resting"
              ? "잠시 쉬고 있어요. 다시 말하면 바로 이어집니다"
              : "말하세요…"}
          </span>
        )}
      </p>
    </div>
  );
}
