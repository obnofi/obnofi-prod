import { NextRequest, NextResponse } from "next/server";
import { togglePublicationLike } from "@/lib/publishedPages";
import { getAuthenticatedUserId } from "@/lib/workspace-resolution";

async function mutateLike(
  request: NextRequest,
  publishId: string,
  shouldLike: boolean
) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publication = await togglePublicationLike(publishId, userId, shouldLike);
  if (!publication) {
    return NextResponse.json({ error: "Published snapshot not found" }, { status: 404 });
  }

  return NextResponse.json(publication);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publishId: string }> }
) {
  try {
    const { publishId } = await params;
    return await mutateLike(request, publishId, true);
  } catch (error) {
    console.error("[POST /api/published-pages/[publishId]/like]", error);
    return NextResponse.json({ error: "Failed to like snapshot" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ publishId: string }> }
) {
  try {
    const { publishId } = await params;
    return await mutateLike(request, publishId, false);
  } catch (error) {
    console.error("[DELETE /api/published-pages/[publishId]/like]", error);
    return NextResponse.json({ error: "Failed to unlike snapshot" }, { status: 500 });
  }
}
