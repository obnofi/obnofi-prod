import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";
import { getExampleDatabaseColumns } from "@/lib/database-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    const page = mockDb.pages.get(pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const existingDb = mockDb.databases.getByPageId(pageId);
    if (existingDb) {
      return NextResponse.json(existingDb);
    }

    const database = mockDb.databases.create(pageId);
    
    getExampleDatabaseColumns().forEach((col) => {
      mockDb.columns.create({
        databaseId: database.id,
        name: col.name,
        type: col.type,
        options: col.options,
      });
    });

    const dbWithColumns = mockDb.databases.get(database.id);
    return NextResponse.json(dbWithColumns, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create database" },
      { status: 500 }
    );
  }
}
