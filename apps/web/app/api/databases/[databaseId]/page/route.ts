import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

// GET /api/databases/[databaseId]/page
// Returns the page info associated with this database
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const database = mockDb.databases.get(databaseId);

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const page = mockDb.pages.get(database.pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: page.id,
      title: page.title,
      type: page.type,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
