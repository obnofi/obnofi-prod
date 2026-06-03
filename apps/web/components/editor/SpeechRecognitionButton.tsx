"use client";

import { Mic, MicOff, Pause } from "lucide-react";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

interface SpeechRecognitionButtonProps {
  isListening: boolean;
  isSupported: boolean;
  listeningState: ParrotListeningState;
  speechLevel: number;
  interimTranscript: string;
  onToggle: () => void;
}

const PARROT_WAVE_BARS = 9;

function getParrotStatusCopy(listeningState: ParrotListeningState) {
  switch (listeningState) {
    case "listening":
      return {
        label: "듣는 중",
        hint: "음성을 따라 파형이 움직입니다",
        icon: Mic,
      };
    case "resting":
      return {
        label: "쉬는 중",
        hint: "잠시 멈췄어요. 다시 말하면 바로 반응합니다",
        icon: Pause,
      };
    case "error":
      return {
        label: "다시 시도",
        hint: "음성 인식이 끊겼습니다",
        icon: MicOff,
      };
    case "unsupported":
      return {
        label: "지원 안 됨",
        hint: "Chrome 또는 Edge에서 사용할 수 있습니다",
        icon: MicOff,
      };
    case "idle":
    default:
      return {
        label: "중지됨",
        hint: "탭해서 Parrot를 시작하세요",
        icon: MicOff,
      };
  }
}

export function SpeechRecognitionButton({
  isListening,
  isSupported,
  listeningState,
  speechLevel,
  interimTranscript,
  onToggle,
}: SpeechRecognitionButtonProps) {
  const statusCopy = getParrotStatusCopy(listeningState);
  const StatusIcon = statusCopy.icon;
  const visualLevel = isListening ? Math.max(speechLevel, 0.14) : 0;
  const transcriptPreview = interimTranscript.trim()
    ? interimTranscript.trim()
    : statusCopy.hint;
  const showExpandedParrotPanel =
    isListening || listeningState === "error" || listeningState === "unsupported";

  if (!showExpandedParrotPanel) {
    return (
      <div
        data-export-ignore="true"
        title={
          !isSupported
            ? "이 브라우저는 음성인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해 주세요."
            : "음성인식 시작 (앵무새)"
        }
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={!isSupported}
          aria-label="음성인식 시작"
          aria-pressed={false}
          className={[
            "flex h-11 min-w-11 items-center justify-center rounded-2xl px-3 text-sm transition",
            isSupported
              ? "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
              : "cursor-not-allowed opacity-50",
          ].join(" ")}
        >
          <Mic className="h-[18px] w-[18px]" />
        </button>
      </div>
    );
  }

  return (
    <div
      data-export-ignore="true"
      title={
        !isSupported
          ? "이 브라우저는 음성인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해 주세요."
          : isListening
            ? "음성인식 중지"
            : "음성인식 시작 (앵무새)"
      }
      className="min-w-[252px] max-w-[320px]"
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!isSupported}
        aria-label={isListening ? "음성인식 중지" : "음성인식 시작"}
        aria-pressed={isListening}
        className={[
          "group relative flex w-full items-center gap-3 overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-3 text-left shadow-[0_18px_50px_rgba(15,23,42,0.14)] transition",
          isSupported ? "hover:bg-[var(--color-hover)]" : "cursor-not-allowed opacity-50",
        ].join(" ")}
      >
        <span
          className={[
            "absolute inset-x-5 bottom-0 h-px origin-left bg-[var(--color-accent)] transition-transform duration-300",
            isListening ? "scale-x-100 opacity-35" : "scale-x-0 opacity-0",
          ].join(" ")}
        />

        <span
          className={[
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition",
            isListening
              ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
              : "bg-[var(--color-background)] text-[var(--color-text-secondary)]",
          ].join(" ")}
        >
          {isListening ? (
            <span className="absolute inset-0 rounded-full bg-[var(--color-accent-subtle)] parrot-orbit-pulse" />
          ) : null}
          <StatusIcon className="relative z-10 h-[18px] w-[18px]" />
        </span>

        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 min-w-[86px] flex-1 items-center justify-center gap-1 rounded-full bg-[var(--color-background)] px-3"
          >
            {Array.from({ length: PARROT_WAVE_BARS }, (_, index) => {
              const spread = Math.abs(index - (PARROT_WAVE_BARS - 1) / 2);
              const restingBase = 0.26 - spread * 0.018;
              const speakingLift = visualLevel * (1 - spread * 0.12);
              const barScale = Math.max(
                0.16,
                Math.min(1, restingBase + speakingLift)
              );

              return (
                <span
                  key={index}
                  className={[
                    "parrot-wave-bar inline-flex w-1 rounded-full bg-[var(--color-accent)]",
                    listeningState === "listening" ? "opacity-95" : "opacity-55",
                  ].join(" ")}
                  style={
                    {
                      height: `${18 + Math.round(barScale * 18)}px`,
                      animationDelay: `${index * 70}ms`,
                      animationDuration: `${680 + index * 35}ms`,
                      transform: `scaleY(${barScale})`,
                    }
                  }
                />
              );
            })}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                Parrot
              </span>
              <span
                className={[
                  "rounded-full px-2 py-1 text-[11px] font-medium",
                  listeningState === "listening"
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    : "bg-[var(--color-background)] text-[var(--color-text-secondary)]",
                ].join(" ")}
              >
                {statusCopy.label}
              </span>
            </span>
            <span className="mt-1 line-clamp-2 block text-[12px] leading-5 text-[var(--color-text-secondary)]">
              {transcriptPreview}
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
