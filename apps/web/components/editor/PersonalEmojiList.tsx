"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentType } from "react";
import type { Editor } from "@tiptap/react";
import {
  Clock3,
  Heart,
  Leaf,
  Minus,
  Plus,
  Scissors,
  Smile,
  Wrench,
  X,
} from "lucide-react";
import type { PersonalEmojiPayload } from "./extensions/PersonalEmojiExtension";

type EmojiCategoryId =
  | "recent"
  | "people"
  | "nature"
  | "objects"
  | "symbols";

type BuiltinEmoji = {
  id: string;
  name: string;
  symbol: string;
  keywords: string[];
  group: EmojiCategoryId;
};

type CropState = {
  src: string;
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  x: number;
  y: number;
  size: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  baseSize: number;
};

type EmojiGridItem =
  | {
      id: string;
      label: string;
      kind: "personal";
      emoji: PersonalEmojiPayload;
    }
  | {
      id: string;
      label: string;
      kind: "builtin";
      emoji: BuiltinEmoji;
    };

type PersonalEmojiListProps = {
  query: string;
  command: (item: string) => void;
  editor: Editor;
  range: { from: number; to: number };
};

export type PersonalEmojiListHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

const PERSONAL_EMOJI_STORAGE_KEY = "obnofi.personalEmojis.v1";
const CROP_STAGE_SIZE = 184;

const EMOJI_CATEGORIES: Array<{
  id: EmojiCategoryId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "recent", label: "자주 사용", icon: Clock3 },
  { id: "people", label: "사람", icon: Smile },
  { id: "nature", label: "자연", icon: Leaf },
  { id: "objects", label: "물건", icon: Wrench },
  { id: "symbols", label: "기호", icon: Heart },
];

const BUILTIN_EMOJIS: BuiltinEmoji[] = [
  { id: "relieved", name: "relieved", symbol: "☺️", group: "people", keywords: ["smile", "사람"] },
  { id: "kissing", name: "kissing", symbol: "😙", group: "people", keywords: ["kiss", "사람"] },
  { id: "person", name: "person", symbol: "🧍", group: "people", keywords: ["person", "사람"] },
  { id: "detective", name: "detective", symbol: "🕵️", group: "people", keywords: ["detective", "사람"] },
  { id: "shushing", name: "shushing", symbol: "🤫", group: "people", keywords: ["quiet", "사람"] },
  { id: "guard", name: "guard", symbol: "💂", group: "people", keywords: ["guard", "사람"] },
  { id: "standing", name: "standing", symbol: "🧍‍♂️", group: "people", keywords: ["stand", "사람"] },
  { id: "skier", name: "skier", symbol: "⛷️", group: "people", keywords: ["ski", "사람"] },
  { id: "neutral", name: "neutral", symbol: "😐", group: "people", keywords: ["neutral", "사람"] },
  { id: "bath", name: "bath", symbol: "🛀", group: "people", keywords: ["bath", "사람"] },
  { id: "brain", name: "brain", symbol: "🧠", group: "people", keywords: ["brain", "사람"] },
  { id: "spy", name: "spy", symbol: "🕵️‍♂️", group: "people", keywords: ["spy", "사람"] },
  { id: "walking", name: "walking", symbol: "🚶", group: "people", keywords: ["walk", "사람"] },
  { id: "smile", name: "smile", symbol: "🙂", group: "people", keywords: ["smile", "사람"] },
  { id: "laugh", name: "laugh", symbol: "😆", group: "people", keywords: ["laugh", "사람"] },
  { id: "angel", name: "angel", symbol: "😇", group: "people", keywords: ["angel", "사람"] },
  { id: "hug", name: "hug", symbol: "🫂", group: "people", keywords: ["hug", "사람"] },
  { id: "skull", name: "skull", symbol: "💀", group: "people", keywords: ["skull", "사람"] },
  { id: "clap", name: "clap", symbol: "👏", group: "people", keywords: ["hand", "박수"] },
  { id: "pray", name: "pray", symbol: "🙏", group: "people", keywords: ["hand", "기도"] },
  { id: "write", name: "write", symbol: "✍️", group: "people", keywords: ["hand", "쓰기"] },
  { id: "sparkles", name: "sparkles", symbol: "✨", group: "recent", keywords: ["sparkle", "반짝"] },
  { id: "burger", name: "burger", symbol: "🍔", group: "recent", keywords: ["food", "최근"] },
  { id: "star", name: "star", symbol: "🤩", group: "recent", keywords: ["star", "최근"] },
  { id: "party", name: "party", symbol: "🎉", group: "recent", keywords: ["party", "축하"] },
  { id: "cat", name: "cat", symbol: "😺", group: "nature", keywords: ["cat", "고양이"] },
  { id: "seed", name: "seed", symbol: "🌱", group: "nature", keywords: ["plant", "seed", "씨앗"] },
  { id: "tree", name: "tree", symbol: "🌳", group: "nature", keywords: ["jungle", "tree", "나무"] },
  { id: "leaf", name: "leaf", symbol: "🍃", group: "nature", keywords: ["leaf", "잎"] },
  { id: "fire", name: "fire", symbol: "🔥", group: "nature", keywords: ["hot", "fire", "불"] },
  { id: "rocket", name: "rocket", symbol: "🚀", group: "objects", keywords: ["ship", "launch", "출시"] },
  { id: "pin", name: "pin", symbol: "📌", group: "objects", keywords: ["pin", "고정"] },
  { id: "memo", name: "memo", symbol: "📝", group: "objects", keywords: ["memo", "note", "메모"] },
  { id: "calendar", name: "calendar", symbol: "📅", group: "objects", keywords: ["date", "calendar", "일정"] },
  { id: "link", name: "link", symbol: "🔗", group: "objects", keywords: ["link", "링크"] },
  { id: "lock", name: "lock", symbol: "🔒", group: "objects", keywords: ["lock", "잠금"] },
  { id: "light", name: "light", symbol: "💡", group: "objects", keywords: ["idea", "light", "아이디어"] },
  { id: "warning", name: "warning", symbol: "⚠️", group: "symbols", keywords: ["warn", "주의"] },
  { id: "check", name: "check", symbol: "✅", group: "symbols", keywords: ["done", "check", "완료"] },
  { id: "speech", name: "speech", symbol: "🗨️", group: "symbols", keywords: ["speech", "말풍선"] },
  { id: "heart", name: "heart", symbol: "💗", group: "symbols", keywords: ["heart", "하트"] },
  { id: "blue-heart", name: "blue-heart", symbol: "💙", group: "symbols", keywords: ["heart", "하트"] },
  { id: "green-heart", name: "green-heart", symbol: "💚", group: "symbols", keywords: ["heart", "하트"] },
];

function normalizeEmojiName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampCrop(crop: CropState): CropState {
  const maxSize = Math.min(crop.imageWidth, crop.imageHeight);
  const minSize = Math.max(16, maxSize * 0.18);
  const size = clamp(crop.size, minSize, maxSize);

  return {
    ...crop,
    size,
    x: clamp(crop.x, 0, Math.max(0, crop.imageWidth - size)),
    y: clamp(crop.y, 0, Math.max(0, crop.imageHeight - size)),
  };
}

function readPersonalEmojis(): PersonalEmojiPayload[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PERSONAL_EMOJI_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PersonalEmojiPayload =>
        typeof item?.id === "string" &&
        typeof item?.name === "string" &&
        typeof item?.src === "string"
    );
  } catch {
    return [];
  }
}

function writePersonalEmojis(items: PersonalEmojiPayload[]) {
  window.localStorage.setItem(PERSONAL_EMOJI_STORAGE_KEY, JSON.stringify(items));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function insertBuiltinEmoji(
  editor: Editor,
  range: { from: number; to: number },
  symbol: string
) {
  editor.chain().focus().deleteRange(range).insertContent(symbol).run();
}

function insertPersonalEmoji(
  editor: Editor,
  range: { from: number; to: number },
  emoji: PersonalEmojiPayload
) {
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertCustomEmoji(emoji)
    .insertContent(" ")
    .run();
}

export const PersonalEmojiList = forwardRef<
  PersonalEmojiListHandle,
  PersonalEmojiListProps
>(function PersonalEmojiList({ query, editor, range }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [personalEmojis, setPersonalEmojis] = useState<PersonalEmojiPayload[]>([]);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [emojiName, setEmojiName] = useState("");
  const [activeCategory, setActiveCategory] = useState<EmojiCategoryId>("people");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    setPersonalEmojis(readPersonalEmojis());
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredBuiltin = useMemo(
    () =>
      BUILTIN_EMOJIS.filter((emoji) => {
        if (!normalizedQuery) return true;
        return (
          emoji.name.includes(normalizedQuery) ||
          emoji.keywords.some((keyword) => keyword.includes(normalizedQuery))
        );
      }),
    [normalizedQuery]
  );

  const filteredPersonal = useMemo(
    () =>
      personalEmojis.filter((emoji) => {
        if (!normalizedQuery) return true;
        return emoji.name.toLowerCase().includes(normalizedQuery);
      }),
    [normalizedQuery, personalEmojis]
  );

  const gridItems = useMemo<EmojiGridItem[]>(() => {
    const personalItems = filteredPersonal.map((emoji) => ({
      id: emoji.id,
      label: emoji.name,
      kind: "personal" as const,
      emoji,
    }));

    if (normalizedQuery) {
      return [
        ...personalItems,
        ...filteredBuiltin.map((emoji) => ({
          id: emoji.id,
          label: emoji.name,
          kind: "builtin" as const,
          emoji,
        })),
      ];
    }

    return filteredBuiltin
      .filter((emoji) => emoji.group === activeCategory)
      .map((emoji) => ({
        id: emoji.id,
        label: emoji.name,
        kind: "builtin" as const,
        emoji,
      }));
  }, [activeCategory, filteredBuiltin, filteredPersonal, normalizedQuery]);

  const handleSelect = useCallback(
    (item: EmojiGridItem | undefined) => {
      if (!item) return;

      if (item.kind === "personal") {
        insertPersonalEmoji(editor, range, item.emoji);
        return;
      }

      insertBuiltinEmoji(editor, range, item.emoji.symbol);
    },
    [editor, range]
  );

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (crop) return false;

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          setSelectedIndex((prev) =>
            prev <= 0 ? Math.max(gridItems.length - 1, 0) : prev - 1
          );
          return true;
        }

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          setSelectedIndex((prev) =>
            prev >= gridItems.length - 1 ? 0 : prev + 1
          );
          return true;
        }

        if (event.key === "Enter") {
          handleSelect(gridItems[selectedIndex]);
          return true;
        }

        return false;
      },
    }),
    [crop, gridItems, handleSelect, selectedIndex]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeCategory, query]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleFileSelect = useCallback(async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;

    const src = await fileToDataUrl(file);
    const image = await loadImage(src);
    const minSide = Math.min(image.naturalWidth, image.naturalHeight);
    const nextName = normalizeEmojiName(file.name.replace(/\.[^.]+$/, ""));

    setEmojiName(nextName);
    setCrop({
      src,
      fileName: file.name,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      x: Math.round((image.naturalWidth - minSide) / 2),
      y: Math.round((image.naturalHeight - minSide) / 2),
      size: minSide,
    });
  }, []);

  const updateCropSize = useCallback((scale: number) => {
    setCrop((current) => {
      if (!current) return current;
      const centerX = current.x + current.size / 2;
      const centerY = current.y + current.size / 2;
      const nextSize = current.size * scale;

      return clampCrop({
        ...current,
        size: nextSize,
        x: centerX - nextSize / 2,
        y: centerY - nextSize / 2,
      });
    });
  }, []);

  const handleCropPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!crop) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        baseX: crop.x,
        baseY: crop.y,
        baseSize: crop.size,
      };
    },
    [crop]
  );

  const handleCropPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!crop || !drag || drag.pointerId !== event.pointerId) return;

      const sourceDeltaX = ((event.clientX - drag.startX) * drag.baseSize) / CROP_STAGE_SIZE;
      const sourceDeltaY = ((event.clientY - drag.startY) * drag.baseSize) / CROP_STAGE_SIZE;

      setCrop((current) =>
        current
          ? clampCrop({
              ...current,
              x: drag.baseX - sourceDeltaX,
              y: drag.baseY - sourceDeltaY,
            })
          : current
      );
    },
    [crop]
  );

  const handleCropPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
      }
    },
    []
  );

  const handleCropWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      updateCropSize(event.deltaY > 0 ? 1.08 : 0.92);
    },
    [updateCropSize]
  );

  const handleSaveCrop = useCallback(async () => {
    if (!crop) return;

    const name = normalizeEmojiName(emojiName) || "personal-emoji";
    const image = await loadImage(crop.src);
    const canvas = document.createElement("canvas");
    const outputSize = 128;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, outputSize, outputSize);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      outputSize,
      outputSize
    );

    const nextEmoji: PersonalEmojiPayload = {
      id: crypto.randomUUID(),
      name,
      src: canvas.toDataURL("image/png"),
      alt: `:${name}:`,
    };
    const withoutSameName = personalEmojis.filter((emoji) => emoji.name !== name);
    const nextItems = [nextEmoji, ...withoutSameName].slice(0, 48);

    setPersonalEmojis(nextItems);
    writePersonalEmojis(nextItems);
    setCrop(null);
    insertPersonalEmoji(editor, range, nextEmoji);
  }, [crop, editor, emojiName, personalEmojis, range]);

  const cropPreviewStyle = crop
    ? {
        backgroundImage: `url(${crop.src})`,
        backgroundPosition: `${-(crop.x / crop.size) * 100}% ${
          -(crop.y / crop.size) * 100
        }%`,
        backgroundSize: `${(crop.imageWidth / crop.size) * 100}% ${
          (crop.imageHeight / crop.size) * 100
        }%`,
      }
    : undefined;

  if (crop) {
    return (
      <div className="w-[22rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">
              개인 이모지 추가
            </div>
            <div className="truncate text-xs text-[var(--color-text-secondary)]">
              {crop.fileName}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCrop(null)}
            className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-center">
          <div
            className="relative h-[184px] w-[184px] cursor-grab touch-none overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] bg-no-repeat shadow-inner active:cursor-grabbing"
            style={cropPreviewStyle}
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerCancel={handleCropPointerUp}
            onWheel={handleCropWheel}
            aria-label="드래그해서 이모지 위치 조정"
          >
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/60" />
            <div className="pointer-events-none absolute left-1/3 top-0 h-full w-px bg-white/55" />
            <div className="pointer-events-none absolute left-2/3 top-0 h-full w-px bg-white/55" />
            <div className="pointer-events-none absolute left-0 top-1/3 h-px w-full bg-white/55" />
            <div className="pointer-events-none absolute left-0 top-2/3 h-px w-full bg-white/55" />
          </div>
        </div>

        <div className="mb-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => updateCropSize(1.12)}
            className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
            aria-label="축소"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="rounded-md bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
            드래그로 위치 조정
          </div>
          <button
            type="button"
            onClick={() => updateCropSize(0.88)}
            className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
            aria-label="확대"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-3 block text-xs font-medium text-[var(--color-text-secondary)]">
          이름
          <input
            value={emojiName}
            onChange={(event) => setEmojiName(event.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            placeholder="my-emoji"
          />
        </label>

        <button
          type="button"
          onClick={handleSaveCrop}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          <Scissors className="h-4 w-4" />
          잘라서 추가
        </button>
      </div>
    );
  }

  const activeCategoryLabel =
    normalizedQuery
      ? "검색"
      : EMOJI_CATEGORIES.find((category) => category.id === activeCategory)
          ?.label ?? "사람";

  return (
    <div className="flex h-[340px] w-[386px] flex-col overflow-hidden rounded-xl border border-[#d9d9d9] bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelect(event.target.files?.[0])}
      />

      <div className="px-1.5 pt-1.5 text-[13px] font-medium leading-5 text-[#686868] dark:text-zinc-300">
        {activeCategoryLabel}
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-auto px-1.5 pb-1 pt-0.5">
        {gridItems.length > 0 ? (
          <div className="grid grid-cols-10 gap-x-0.5 gap-y-0.5">
            {gridItems.map((item, index) => {
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleSelect(item)}
                  className={[
                    "flex h-[29px] w-[34px] items-center justify-center rounded text-[21px] leading-none transition-colors",
                    isSelected
                      ? "bg-[#ececec] dark:bg-zinc-800"
                      : "hover:bg-[#f0f0f0] dark:hover:bg-zinc-800",
                  ].join(" ")}
                  aria-label={`:${item.label}:`}
                  title={`:${item.label}:`}
                >
                  {item.kind === "personal" ? (
                    <img
                      src={item.emoji.src}
                      alt={item.emoji.alt ?? item.emoji.name}
                      className="h-[22px] w-[22px] rounded-sm object-cover"
                    />
                  ) : (
                    item.emoji.symbol
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-16 text-center text-sm text-[#777] dark:text-zinc-400">
            일치하는 이모지가 없습니다.
          </div>
        )}
      </div>

      <div className="flex h-[42px] shrink-0 items-center border-t border-[#dedede] bg-[#f7f7f7] px-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-1 items-center justify-between">
          {EMOJI_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = !normalizedQuery && activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-white text-[#5f5f5f] shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-[#8a8a8a] hover:bg-white/80 hover:text-[#5f5f5f] dark:text-zinc-500 dark:hover:bg-zinc-800",
                ].join(" ")}
                aria-label={category.label}
                title={category.label}
              >
                <Icon className="h-[17px] w-[17px]" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8a8a8a] text-white transition-colors hover:bg-[#707070] dark:bg-zinc-700 dark:hover:bg-zinc-600"
          aria-label="개인 이모지 추가"
          title="개인 이모지 추가"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
