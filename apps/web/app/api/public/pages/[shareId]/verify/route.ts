import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { mockDb } from "@/lib/mock-db";
import { sanitizePublicContent } from "@/lib/public-content";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const body = await request.json();
    const { password } = body;

    const page = mockDb.pages.getByShareId(shareId);

    if (!page || !page.isPublic) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (!page.sharePassword) {
      return NextResponse.json({
        id: page.id,
        title: page.title,
        content: sanitizePublicContent(page.content, mockDb.pages.getAll()),
        isPasswordProtected: false,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      });
    }

    const isValid = await bcrypt.compare(password, page.sharePassword);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: page.id,
      title: page.title,
      content: sanitizePublicContent(page.content, mockDb.pages.getAll()),
      isPasswordProtected: false,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
