"use client";

import Image from "next/image";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

interface SpeechRecognitionButtonProps {
  isListening: boolean;
  isSupported: boolean;
  listeningState: ParrotListeningState;
  onToggle: () => void;
}

export function SpeechRecognitionButton({
  isListening,
  isSupported,
  listeningState,
  onToggle,
}: SpeechRecognitionButtonProps) {
  const isParrotActive =
    listeningState === "listening" ||
    listeningState === "resting" ||
    listeningState === "error";
  const parrotSrc = isParrotActive ? "/toolbar/parrot-on.png" : "/toolbar/parrot-off.png";

  return (
    <div data-export-ignore="true">
      <button
        type="button"
        onClick={onToggle}
        disabled={!isSupported}
        aria-label="Parrot"
        aria-pressed={isListening}
        className={[
          "relative flex h-11 min-w-11 items-center justify-center rounded-2xl px-3 text-sm transition",
          isParrotActive
            ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
            : isSupported
              ? "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
              : "cursor-not-allowed opacity-50",
        ].join(" ")}
      >
        {isListening ? (
          <span className="absolute inset-0 rounded-2xl bg-[var(--color-accent-subtle)] parrot-orbit-pulse" />
        ) : null}
        <Image src={parrotSrc} alt="Parrot" width={18} height={18} className="relative z-10" />
      </button>
    </div>
  );
}
