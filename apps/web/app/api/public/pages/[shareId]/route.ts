import { NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";
import { sanitizePublicContent } from "@/lib/public-content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const page = mockDb.pages.getByShareId(shareId);

    if (!page || !page.isPublic) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (page.sharePassword) {
      return NextResponse.json({
        id: page.id,
        title: page.title,
        content: null,
        isPasswordProtected: true,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      });
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
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
