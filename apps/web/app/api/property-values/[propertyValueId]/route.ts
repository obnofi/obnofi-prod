import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ propertyValueId: string }> }
) {
  try {
    const { propertyValueId } = await params;
    const body = await request.json();

    const propertyValue = mockDb.propertyValues.get(propertyValueId);
    if (!propertyValue) {
      return NextResponse.json(
        { error: "Property value not found" },
        { status: 404 }
      );
    }

    const updatedPropertyValue = mockDb.propertyValues.update(
      propertyValueId,
      body
    );
    return NextResponse.json(updatedPropertyValue);
  } catch {
    return NextResponse.json(
      { error: "Failed to update property value" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ propertyValueId: string }> }
) {
  try {
    const { propertyValueId } = await params;
    const propertyValue = mockDb.propertyValues.get(propertyValueId);

    if (!propertyValue) {
      return NextResponse.json(
        { error: "Property value not found" },
        { status: 404 }
      );
    }

    mockDb.propertyValues.delete(propertyValueId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete property value" },
      { status: 500 }
    );
  }
}
