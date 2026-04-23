import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { columnId } = await params;
    const body = await request.json();

    const column = mockDb.columns.get(columnId);
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const updatedColumn = mockDb.columns.update(columnId, body);
    return NextResponse.json(updatedColumn);
  } catch {
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { columnId } = await params;
    const column = mockDb.columns.get(columnId);

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    mockDb.columns.delete(columnId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 }
    );
  }
}
