import { uploadClearingAsset } from "@/lib/supabase";
import type { Element, ImageElement } from "@obnofi/types/clearing";

export async function uploadImageToBoard(file: File, roomId: string) {
  return uploadClearingAsset(file, roomId);
}

export function createImageElement({
  alt,
  createdBy,
  file,
  roomId,
  url,
  x,
  y,
  zIndex,
}: {
  alt: string;
  createdBy: string;
  file?: File;
  roomId: string;
  url: string;
  x: number;
  y: number;
  zIndex: number;
}): Promise<ImageElement> {
  const fallbackWidth = 320;
  const fallbackHeight = 220;

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      const timestamp = new Date().toISOString();
      resolve({
        id: crypto.randomUUID(),
        roomId,
        type: "image",
        x,
        y,
        width: fallbackWidth,
        height: fallbackHeight,
        rotation: 0,
        zIndex,
        createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
        style: {
          color: "mist",
          opacity: 1,
        },
        content: {
          kind: "image",
          url,
          src: url,
          alt,
          objectFit: "cover",
          borderRadius: 16,
          aspectRatio: fallbackWidth / fallbackHeight,
        },
      });
      return;
    }

    const image = new Image();
    image.onload = () => {
      const naturalWidth = image.naturalWidth || fallbackWidth;
      const naturalHeight = image.naturalHeight || fallbackHeight;
      const aspectRatio = naturalWidth / naturalHeight;
      const width = Math.min(420, naturalWidth);
      const height = Math.round(width / aspectRatio);
      const timestamp = new Date().toISOString();

      resolve({
        id: crypto.randomUUID(),
        roomId,
        type: "image",
        x,
        y,
        width,
        height,
        rotation: 0,
        zIndex,
        createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
        style: {
          color: "mist",
          opacity: 1,
        },
        content: {
          kind: "image",
          url,
          src: url,
          alt: file?.name ?? alt,
          objectFit: "cover",
          borderRadius: 16,
          aspectRatio,
        },
      });
    };
    image.onerror = () => {
      const timestamp = new Date().toISOString();
      resolve({
        id: crypto.randomUUID(),
        roomId,
        type: "image",
        x,
        y,
        width: fallbackWidth,
        height: fallbackHeight,
        rotation: 0,
        zIndex,
        createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
        style: {
          color: "mist",
          opacity: 1,
        },
        content: {
          kind: "image",
          url,
          src: url,
          alt,
          objectFit: "cover",
          borderRadius: 16,
          aspectRatio: fallbackWidth / fallbackHeight,
        },
      });
    };
    image.src = url;
  });
}

export function isImageDrop(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.files).some((file) => file.type.startsWith("image/"));
}

export function toBoardElement(element: ImageElement): Element {
  return element;
}
