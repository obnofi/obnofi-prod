import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { mockDb } from "@/lib/mock-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const body = await request.json();
    const { isPublic, password } = body;

    const page = mockDb.pages.get(pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const updateData: {
      isPublic: boolean;
      shareId?: string;
      sharePassword?: string | null;
    } = { isPublic };

    if (isPublic) {
      if (!page.shareId) {
        updateData.shareId = nanoid(12);
      }
      if (password) {
        updateData.sharePassword = await bcrypt.hash(password, 10);
      }
    } else {
      updateData.shareId = undefined;
      updateData.sharePassword = null;
    }

    const updatedPage = mockDb.pages.update(pageId, updateData);

    return NextResponse.json({
      success: true,
      shareId: updatedPage?.shareId,
      isPublic: updatedPage?.isPublic,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update share settings" },
      { status: 500 }
    );
  }
}
