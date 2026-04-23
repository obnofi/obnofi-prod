import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    const page = mockDb.pages.get(pageId);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const ancestors = mockDb.pages.getAncestors(pageId);

    return NextResponse.json(ancestors);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page ancestors" },
      { status: 500 }
    );
  }
}
