import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";
import { createDefaultPropertyValue } from "@/lib/database-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const body = await request.json();
    const { title = "Untitled" } = body;

    const database = mockDb.databases.get(databaseId);
    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const databasePage = mockDb.pages.get(database.pageId);
    if (!databasePage) {
      return NextResponse.json(
        { error: "Database page not found" },
        { status: 404 }
      );
    }

    const row = mockDb.pages.create({
      title,
      type: "document",
      parentId: database.pageId,
      workspaceId: databasePage.workspaceId,
      databaseId,
      parentDatabaseId: databaseId,
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
      icon: null,
      isPublic: false,
      shareId: null,
      sharePassword: null,
    });

    database.columns.forEach((column) => {
      mockDb.propertyValues.upsert(
        row.id,
        column.id,
        createDefaultPropertyValue(column)
      );
    });

    return NextResponse.json(
      {
        ...row,
        propertyValues: mockDb.propertyValues.getByPage(row.id),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create row" },
      { status: 500 }
    );
  }
}
