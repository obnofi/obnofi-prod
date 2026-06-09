"use client";

import Image from "next/image";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

interface SpeechRecognitionButtonProps {
  isListening: boolean;
  isSupported: boolean;
  listeningState: ParrotListeningState;
  speechLevel?: number;
  onToggle: () => void;
}

export function SpeechRecognitionButton({
  isListening,
  isSupported,
  listeningState,
  speechLevel = 0,
  onToggle,
}: SpeechRecognitionButtonProps) {
  const isParrotActive =
    listeningState === "listening" ||
    listeningState === "resting" ||
    listeningState === "error";
  const parrotSrc = isParrotActive ? "/toolbar/parrot-on.png" : "/toolbar/parrot-off.png";
  const normalizedSpeechLevel = Math.min(Math.max(speechLevel, 0), 1);
  const parrotWaveHeights = [0.58, 0.9, 0.62, 0.94, 0.6];
  const motionBoost =
    listeningState === "resting"
      ? 0.08
      : 0.16 + normalizedSpeechLevel * 0.72;
  const barOpacity =
    listeningState === "resting" ? 0.9 : 0.72 + normalizedSpeechLevel * 0.28;

  if (isListening) {
    return (
      <div data-export-ignore="true" className="flex items-center justify-center">
        <button
          type="button"
          onClick={onToggle}
          disabled={!isSupported}
          aria-label="Parrot 녹음 중지"
          aria-pressed={true}
          className={[
            "relative flex h-[46px] w-[98px] items-center justify-center overflow-hidden rounded-full transition",
            isSupported ? "" : "cursor-not-allowed opacity-50",
          ].join(" ")}
        >
          <span className="absolute inset-0 rounded-full bg-[#338347]" />
          <span className="absolute inset-0 rounded-full parrot-orbit-pulse opacity-50" />
          <span className="absolute inset-0 z-10 flex items-center justify-center">
            <span className="flex h-[24px] items-center gap-[7px]">
            {parrotWaveHeights.map((heightScale, index) => {
              const pulseScale = 1 + motionBoost * (index % 2 === 1 ? 1 : 0.78);
              const nextScale = Math.min(heightScale * pulseScale, 1);

              return (
                <span
                  key={`parrot-wave-${index}`}
                  className="parrot-visualizer-bar h-[24px] w-[10px] rounded-full bg-[#F4EFE5]"
                  style={{
                    ["--parrot-base-scale" as string]: `${heightScale}`,
                    ["--parrot-active-scale" as string]: `${nextScale}`,
                    opacity: barOpacity,
                    animationDelay: `${index * 120}ms`,
                    animationDuration:
                      listeningState === "resting"
                        ? "1800ms"
                        : `${920 - normalizedSpeechLevel * 360}ms`,
                  }}
                />
              );
            })}
            </span>
          </span>
        </button>
      </div>
    );
  }

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
          isSupported
              ? "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
              : "cursor-not-allowed opacity-50",
        ].join(" ")}
      >
        {isListening ? (
          <span className="absolute inset-0 rounded-2xl parrot-orbit-pulse" />
        ) : null}
        <Image src={parrotSrc} alt="Parrot" width={18} height={18} className="relative z-10" />
      </button>
    </div>
  );
}
