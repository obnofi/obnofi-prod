import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, columnId, value } = body;

    if (!pageId || !columnId || !value) {
      return NextResponse.json(
        { error: "pageId, columnId, and value are required" },
        { status: 400 }
      );
    }

    const page = mockDb.pages.get(pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const column = mockDb.columns.get(columnId);
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const existingValue = mockDb.propertyValues.getByPageAndColumn(
      pageId,
      columnId
    );

    if (existingValue) {
      const updated = mockDb.propertyValues.update(existingValue.id, { value });
      return NextResponse.json(updated);
    }

    const propertyValue = mockDb.propertyValues.create({
      pageId,
      columnId,
      value,
    });

    return NextResponse.json(propertyValue, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create property value" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, columnId, value } = body;

    if (!pageId || !columnId || !value) {
      return NextResponse.json(
        { error: "pageId, columnId, and value are required" },
        { status: 400 }
      );
    }

    const propertyValue = mockDb.propertyValues.upsert(pageId, columnId, value);
    return NextResponse.json(propertyValue);
  } catch {
    return NextResponse.json(
      { error: "Failed to upsert property value" },
      { status: 500 }
    );
  }
}
