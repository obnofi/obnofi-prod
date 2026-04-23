import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const query = searchParams.get("q")?.toLowerCase().trim() || "";

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    const pages = mockDb.pages.getByWorkspace(workspaceId);
    const databasePages = pages.filter((page) => page.type === "database");

    const results = databasePages
      .filter((page) =>
        query ? page.title.toLowerCase().includes(query) : true
      )
      .map((page) => ({
        id: page.id,
        title: page.title,
        icon: page.icon ?? null,
        databaseId: page.databaseId ?? "",
      }))
      .filter((item) => item.databaseId);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Failed to search databases" },
      { status: 500 }
    );
  }
}
