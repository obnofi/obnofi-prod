"use client";

export type FloatingEmojiStamp = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  createdAt: number;
  userName?: string;
};

export function EmojiStamp({
  stamp,
}: {
  stamp: FloatingEmojiStamp;
}) {
  return (
    <div
      className="pointer-events-none absolute z-40 text-3xl animate-[emoji-pop_3s_ease-out_forwards]"
      style={{
        left: stamp.x,
        top: stamp.y,
      }}
      title={stamp.userName}
    >
      {stamp.emoji}
    </div>
  );
}
