import type { EmbedElement } from "@obnofi/types/clearing";

export function parseEmbed(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    const videoId =
      parsed.searchParams.get("v") ||
      parsed.pathname.split("/").filter(Boolean).pop();
    if (videoId) {
      return {
        embedType: "youtube" as const,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        title: "YouTube video",
        domain: host,
      };
    }
  }

  if (host.includes("figma.com")) {
    return {
      embedType: "figma" as const,
      embedUrl: `https://www.figma.com/embed?embed_host=obnofi&url=${encodeURIComponent(url)}`,
      title: "Figma file",
      domain: host,
    };
  }

  if (host.includes("google.") && parsed.pathname.includes("/maps")) {
    return {
      embedType: "google-maps" as const,
      embedUrl: url,
      title: "Google Maps",
      domain: host,
    };
  }

  return {
    embedType: "link-card" as const,
    title: parsed.pathname && parsed.pathname !== "/" ? parsed.pathname.slice(1) : host,
    domain: host,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
  };
}

export function createEmbedElement({
  createdBy,
  roomId,
  url,
  x,
  y,
  zIndex,
}: {
  createdBy: string;
  roomId: string;
  url: string;
  x: number;
  y: number;
  zIndex: number;
}): EmbedElement | null {
  const parsed = parseEmbed(url);
  if (!parsed) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const width = parsed.embedType === "link-card" ? 340 : 480;
  const height = parsed.embedType === "link-card" ? 120 : 300;

  return {
    id: crypto.randomUUID(),
    roomId,
    type: "embed",
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
      kind: "embed",
      url,
      embedType: parsed.embedType,
      embedUrl: parsed.embedUrl,
      title: parsed.title,
      domain: parsed.domain,
      faviconUrl: parsed.faviconUrl,
      borderRadius: 16,
    },
  };
}
