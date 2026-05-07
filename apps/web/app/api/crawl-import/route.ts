import { NextRequest, NextResponse } from "next/server";

const CRAWL_TIMEOUT_MS = 30_000;

function getCrawlerBaseUrl() {
  return process.env.CRAWLER_URL ?? "http://localhost:3100";
}

function errorBody(message: string, url: string) {
  return { error: "CrawlImportError", message, url };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : "";

  if (!url) {
    return NextResponse.json(errorBody("url is required", ""), { status: 400 });
  }

  try {
    const response = await fetch(`${getCrawlerBaseUrl()}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      cache: "no-store",
      signal: AbortSignal.timeout(CRAWL_TIMEOUT_MS),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const status =
        response.status === 408 ||
        response.status === 500 ||
        response.status === 502
          ? response.status
          : 502;
      return NextResponse.json(
        {
          error: data?.error ?? "CrawlImportError",
          message:
            data?.message ?? `Crawler request failed with status ${response.status}`,
          url: data?.url ?? url,
        },
        { status }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        errorBody("Crawler returned an invalid response body", url),
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      errorBody(
        isTimeout ? "Crawler request timed out" : "Failed to reach crawler service",
        url
      ),
      { status: isTimeout ? 408 : 502 }
    );
  }
}
