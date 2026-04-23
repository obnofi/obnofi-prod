import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

// GET /api/databases/[databaseId]/views
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

    const views = mockDb.views.getByDatabase(databaseId);
    return NextResponse.json(views);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch views" },
      { status: 500 }
    );
  }
}

// POST /api/databases/[databaseId]/views
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const body = await request.json();
    const { name, type, config } = body;

    const database = mockDb.databases.get(databaseId);
    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const view = mockDb.views.create({
      databaseId,
      name: name || `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      config: config || {
        visibleProperties: database.properties.map((p) => p.id),
        propertyWidths: {},
        sorts: [],
        filters: [],
      },
    });

    return NextResponse.json(view, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create view" },
      { status: 500 }
    );
  }
}
