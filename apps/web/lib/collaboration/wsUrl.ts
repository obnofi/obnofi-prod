export function resolveCollaborationServerUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (configuredUrl) {
    const normalized = configuredUrl.replace(/\/+$/, "");
    return normalized.endsWith("/ws") ? normalized : `${normalized}/ws`;
  }

  if (typeof window === "undefined") {
    return "ws://localhost:3001/ws";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const { hostname, host } = window.location;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  const baseUrl = isLocalHost ? `${protocol}//${hostname}:3001` : `${protocol}//${host}`;
  return `${baseUrl}/ws`;
}
