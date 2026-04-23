import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

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

    return NextResponse.json(database);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch database" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const database = mockDb.databases.get(databaseId);

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    mockDb.databases.delete(databaseId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}
