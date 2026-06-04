"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type ParrotListeningState =
  | "idle"
  | "listening"
  | "resting"
  | "unsupported"
  | "error";

// Web Speech API type declarations (not yet in lib.dom.d.ts for all envs)
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export interface UseSpeechRecognitionOptions {
  /** 최종 확정된 결과가 나올 때마다 호출됩니다. 에디터 삽입 등에 사용하세요. */
  onFinalResult?: (text: string) => void;
}

export interface UseSpeechRecognitionReturn {
  /** 이번 세션에서 확정된 텍스트 전체 누적본 */
  transcript: string;
  /** 현재 처리 중인 미확정(interim) 텍스트 */
  interimTranscript: string;
  /** 녹음 진행 중 여부 */
  isListening: boolean;
  /** 현재 음성 인식 상태 */
  listeningState: ParrotListeningState;
  /** 브라우저가 Web Speech API를 지원하는지 여부 (Chrome/Edge: true) */
  isSupported: boolean;
  /** 최근 발화 강도를 0~1 사이 값으로 정규화한 값 */
  speechLevel: number;
  /** 음성인식 시작 */
  start: () => void;
  /** 음성인식 중지 */
  stop: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listeningState, setListeningState] =
    useState<ParrotListeningState>("idle");
  const [speechLevel, setSpeechLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalResultRef = useRef(options.onFinalResult);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechLevelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimTranscriptRef = useRef("");
  const skippedFinalTextRef = useRef<string | null>(null);

  useEffect(() => {
    onFinalResultRef.current = options.onFinalResult;
  }, [options.onFinalResult]);

  useEffect(() => {
    interimTranscriptRef.current = interimTranscript;
  }, [interimTranscript]);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!isSupported) {
      setListeningState("unsupported");
    }
  }, [isSupported]);

  const clearParrotTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (speechLevelTimerRef.current) {
      clearTimeout(speechLevelTimerRef.current);
      speechLevelTimerRef.current = null;
    }
  }, []);

  const settleParrotRestingState = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      setListeningState("resting");
      setSpeechLevel(0.18);
    }, 1400);
  }, []);

  const bumpSpeechLevel = useCallback(
    (sampleText: string) => {
      const normalizedLength = Math.min(Math.max(sampleText.trim().length, 1), 18);
      const nextLevel = Math.min(1, 0.35 + normalizedLength / 18);
      setSpeechLevel(nextLevel);
      setListeningState("listening");
      settleParrotRestingState();

      if (speechLevelTimerRef.current) {
        clearTimeout(speechLevelTimerRef.current);
      }
      speechLevelTimerRef.current = setTimeout(() => {
        setSpeechLevel((currentLevel) => Math.max(currentLevel * 0.55, 0.2));
      }, 260);
    },
    [settleParrotRestingState]
  );

  const start = useCallback(() => {
    if (!isSupported) return;

    clearParrotTimers();

    const win = window as WindowWithSpeech;
    const SpeechRecognitionAPI =
      win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";

    recognition.onstart = () => {
      skippedFinalTextRef.current = null;
      setIsListening(true);
      setListeningState("resting");
      setSpeechLevel(0.18);
      settleParrotRestingState();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const normalizedText = text.trim();
          if (
            normalizedText &&
            skippedFinalTextRef.current &&
            skippedFinalTextRef.current === normalizedText
          ) {
            skippedFinalTextRef.current = null;
            continue;
          }
          setTranscript((prev) => prev + text);
          bumpSpeechLevel(text);
          onFinalResultRef.current?.(text);
        } else {
          interim += text;
        }
      }
      if (interim.trim()) {
        bumpSpeechLevel(interim);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = () => {
      clearParrotTimers();
      setIsListening(false);
      setInterimTranscript("");
      setSpeechLevel(0);
      setListeningState("error");
    };

    recognition.onend = () => {
      clearParrotTimers();
      skippedFinalTextRef.current = null;
      setIsListening(false);
      setInterimTranscript("");
      setSpeechLevel(0);
      setListeningState(isSupported ? "idle" : "unsupported");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [bumpSpeechLevel, clearParrotTimers, isSupported, settleParrotRestingState]);

  const stop = useCallback(() => {
    clearParrotTimers();
    const pendingText = interimTranscriptRef.current.trim();
    if (pendingText) {
      skippedFinalTextRef.current = pendingText;
      setTranscript((prev) => prev + pendingText);
      onFinalResultRef.current?.(pendingText);
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimTranscript("");
    setSpeechLevel(0);
    setListeningState(isSupported ? "idle" : "unsupported");
  }, [clearParrotTimers, isSupported]);

  useEffect(() => {
    return () => {
      clearParrotTimers();
      recognitionRef.current?.abort();
    };
  }, [clearParrotTimers]);

  return {
    transcript,
    interimTranscript,
    isListening,
    listeningState,
    isSupported,
    speechLevel,
    start,
    stop,
  };
}
