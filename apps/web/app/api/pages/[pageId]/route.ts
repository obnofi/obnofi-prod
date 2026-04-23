import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const view = request.nextUrl.searchParams.get("view");

    if (view === "full") {
      const databasePage = mockDb.pages.getDatabasePage(pageId);

      if (databasePage) {
        return NextResponse.json(databasePage);
      }

      return NextResponse.json({ error: "Not a database page" }, { status: 404 });
    }

    const page = mockDb.pages.get(pageId);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const body = await request.json();

    const page = mockDb.pages.get(pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const updatedPage = mockDb.pages.update(pageId, body);
    return NextResponse.json(updatedPage);
  } catch {
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const page = mockDb.pages.get(pageId);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    mockDb.pages.delete(pageId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
