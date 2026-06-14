"use client";

import { useSyncExternalStore } from "react";

export type JungleCursorVariant = "pointing" | "highlighting" | "fucku";
export type JungleCursorColorKey = "green" | "leafy" | "blue" | "pink";

const CURSOR_COLOR_STORAGE_KEY = "obnofi:jungle-cursor-color";
const CURSOR_SCALE = 0.45;
const CURSOR_SIZE_REDUCTION_PX = 5;
const CURSOR_METRICS: Record<
  JungleCursorVariant,
  { width: number; height: number; hotspotX: number; hotspotY: number }
> = {
  pointing: { width: 45, height: 50, hotspotX: 4, hotspotY: 2 },
  highlighting: { width: 53, height: 53, hotspotX: 4, hotspotY: 2 },
  fucku: { width: 39, height: 52, hotspotX: 4, hotspotY: 2 },
};
const CURSOR_COLORS: Record<JungleCursorColorKey, string> = {
  green: "#2B593F",
  leafy: "#B4B567",
  blue: "#3B9CBD",
  pink: "#EC6983",
};
const CURSOR_COLOR_KEYS = Object.keys(CURSOR_COLORS) as JungleCursorColorKey[];
const scaledCursorCssCache = new Map<string, string>();

type JungleCursorState = {
  colorKey: JungleCursorColorKey;
  color: string;
  variant: JungleCursorVariant;
  cursorCss: string;
};

let initialized = false;
let pressedKeys = new Set<string>();
let forcedVariant: JungleCursorVariant | null = null;
let state: JungleCursorState = buildState("green", "pointing");
const listeners = new Set<() => void>();

function buildState(
  colorKey: JungleCursorColorKey,
  variant: JungleCursorVariant
): JungleCursorState {
  return {
    colorKey,
    color: CURSOR_COLORS[colorKey],
    variant,
    cursorCss: buildCursorCssValue(variant, colorKey),
  };
}

function normalizeKey(value: string | undefined): string {
  if (!value) {
    return "";
  }
  return value.toLowerCase();
}

function readStoredColorKey(): JungleCursorColorKey {
  if (typeof window === "undefined") {
    return "green";
  }

  const stored = window.sessionStorage.getItem(CURSOR_COLOR_STORAGE_KEY);
  if (stored && CURSOR_COLOR_KEYS.includes(stored as JungleCursorColorKey)) {
    return stored as JungleCursorColorKey;
  }

  const randomIndex = Math.floor(Math.random() * CURSOR_COLOR_KEYS.length);
  const nextColorKey = CURSOR_COLOR_KEYS[randomIndex] ?? "green";
  window.sessionStorage.setItem(CURSOR_COLOR_STORAGE_KEY, nextColorKey);
  return nextColorKey;
}

function getNextVariant(): JungleCursorVariant {
  if (forcedVariant) {
    return forcedVariant;
  }

  if (pressedKeys.has("h")) {
    return "fucku";
  }

  if (pressedKeys.has("x") && (pressedKeys.has("meta") || pressedKeys.has("control"))) {
    return "highlighting";
  }

  return "pointing";
}

function emit() {
  listeners.forEach((listener) => listener());
}

function syncState(nextVariant = getNextVariant()) {
  const colorKey = state.colorKey;
  const nextState = buildState(colorKey, nextVariant);
  if (
    nextState.colorKey === state.colorKey &&
    nextState.variant === state.variant &&
    nextState.cursorCss === state.cursorCss
  ) {
    return;
  }

  state = nextState;
  emit();
  void ensureScaledCursorCss(nextVariant, colorKey);
}

function handleKeyDown(event: KeyboardEvent) {
  const active = document.activeElement as HTMLElement | null;
  if (
    active?.tagName === "INPUT" ||
    active?.tagName === "TEXTAREA" ||
    active?.getAttribute("contenteditable") === "true"
  ) {
    return;
  }
  const normalized = normalizeKey(event.key);
  if (!normalized) {
    return;
  }
  pressedKeys.add(normalized);
  syncState();
}

function handleKeyUp(event: KeyboardEvent) {
  const normalized = normalizeKey(event.key);
  if (!normalized) {
    return;
  }
  pressedKeys.delete(normalized);
  syncState();
}

function resetPressedKeys() {
  pressedKeys = new Set<string>();
  syncState("pointing");
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;
  state = buildState(readStoredColorKey(), "pointing");
  void ensureScaledCursorCss(state.variant, state.colorKey);

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", resetPressedKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetPressedKeys();
    }
  });
}

export function getJungleCursorColorValue(colorKey: JungleCursorColorKey): string {
  return CURSOR_COLORS[colorKey];
}

export function setJungleCursorVariant(variant: JungleCursorVariant | null) {
  forcedVariant = variant;
  syncState();
}

export function resolveJungleCursorColor(
  colorKey: JungleCursorColorKey | undefined,
  fallbackColor?: string
): string {
  if (colorKey) {
    return getJungleCursorColorValue(colorKey);
  }

  return fallbackColor ?? CURSOR_COLORS.green;
}

export function getJungleCursorRenderMetrics(variant: JungleCursorVariant) {
  const metrics = CURSOR_METRICS[variant];
  const scaledWidth = Math.round(metrics.width * CURSOR_SCALE);
  const scaledHeight = Math.round(metrics.height * CURSOR_SCALE);
  const width = Math.max(1, scaledWidth - CURSOR_SIZE_REDUCTION_PX);
  const height = Math.max(1, scaledHeight - CURSOR_SIZE_REDUCTION_PX);
  const widthRatio = width / scaledWidth;
  const heightRatio = height / scaledHeight;

  return {
    width,
    height,
    hotspotX: Math.max(0, Math.round(metrics.hotspotX * CURSOR_SCALE * widthRatio)),
    hotspotY: Math.max(0, Math.round(metrics.hotspotY * CURSOR_SCALE * heightRatio)),
  } as const;
}

export function getJungleCursorAssetPath(
  variant: JungleCursorVariant,
  colorKey: JungleCursorColorKey
): string {
  const filePrefix =
    variant === "pointing" ? "point" : variant === "highlighting" ? "highlighting" : "fucku";

  return `/cursor/${variant}/${filePrefix}_${colorKey}.png`;
}

export function buildCursorCssValue(
  variant: JungleCursorVariant,
  colorKey: JungleCursorColorKey
): string {
  const metrics = getJungleCursorRenderMetrics(variant);
  return `url("${getJungleCursorAssetPath(variant, colorKey)}") ${metrics.hotspotX} ${metrics.hotspotY}, auto`;
}

async function ensureScaledCursorCss(
  variant: JungleCursorVariant,
  colorKey: JungleCursorColorKey
) {
  if (typeof window === "undefined") {
    return;
  }

  const cacheKey = `${variant}:${colorKey}`;
  const cached = scaledCursorCssCache.get(cacheKey);
  if (cached) {
    if (state.variant === variant && state.colorKey === colorKey && state.cursorCss !== cached) {
      state = { ...state, cursorCss: cached };
      emit();
    }
    return;
  }

  const src = getJungleCursorAssetPath(variant, colorKey);
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

  if (!image.naturalWidth || !image.naturalHeight) {
    return;
  }

  const metrics = getJungleCursorRenderMetrics(variant);
  const canvas = document.createElement("canvas");
  canvas.width = metrics.width;
  canvas.height = metrics.height;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.imageSmoothingEnabled = true;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const cssValue = `url("${canvas.toDataURL("image/png")}") ${metrics.hotspotX} ${metrics.hotspotY}, auto`;
  scaledCursorCssCache.set(cacheKey, cssValue);

  if (state.variant === variant && state.colorKey === colorKey && state.cursorCss !== cssValue) {
    state = { ...state, cursorCss: cssValue };
    emit();
  }
}

export function useJungleCursor() {
  ensureInitialized();

  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}
