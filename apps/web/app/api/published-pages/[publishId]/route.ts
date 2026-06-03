import { NextRequest, NextResponse } from "next/server";
import { getPublishedSnapshotDetail, softDeletePublication } from "@/lib/publishedPages";
import { getAuthenticatedUserId } from "@/lib/workspace-resolution";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publishId: string }> }
) {
  try {
    const { publishId } = await params;
    const viewerUserId = await getAuthenticatedUserId(request);
    const publication = await getPublishedSnapshotDetail(publishId, viewerUserId);

    if (!publication) {
      return NextResponse.json({ error: "Published snapshot not found" }, { status: 404 });
    }

    return NextResponse.json(publication);
  } catch (error) {
    console.error("[GET /api/published-pages/[publishId]]", error);
    return NextResponse.json({ error: "Failed to fetch published snapshot" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ publishId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publishId } = await params;
    const deleted = await softDeletePublication(publishId, userId);

    if (!deleted) {
      return NextResponse.json({ error: "Published snapshot not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/published-pages/[publishId]]", error);
    return NextResponse.json({ error: "Failed to unpublish snapshot" }, { status: 500 });
  }
}
