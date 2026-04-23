import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";
import {
  createDefaultPropertyValue,
  DATABASE_COLUMN_TYPES,
  normalizePropertyOptions,
} from "@/lib/database-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const body = await request.json();
    const { name, type, options } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }

    const database = mockDb.databases.get(databaseId);
    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (!DATABASE_COLUMN_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid column type" }, { status: 400 });
    }

    const normalizedOptions = normalizePropertyOptions(type, name, options);

    const column = mockDb.columns.create({
      databaseId,
      name,
      type,
      options: normalizedOptions,
    });

    database.rows.forEach((row) => {
      mockDb.propertyValues.upsert(
        row.id,
        column.id,
        createDefaultPropertyValue(column)
      );
    });

    return NextResponse.json(column, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}
