import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/workspace-resolution";
import {
  canUserAccessPage,
  canUserAccessWorkspace,
  createGraphPublication,
  createPagePublication,
  getActiveGraphPublicationForWorkspace,
  getActivePublicationForPage,
  listForestTags,
  listPublishedSnapshots,
  normalizeTags,
  validatePublishedSnapshotInput,
} from "@/lib/publishedPages";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mine = searchParams.get("mine") === "true";
    const pageId = searchParams.get("pageId");
    const workspaceId = searchParams.get("workspaceId");
    const sort = searchParams.get("sort") === "popular" ? "popular" : "latest";
    const tag = searchParams.get("tag");

    if (mine) {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (pageId) {
        return NextResponse.json(await getActivePublicationForPage(userId, pageId));
      }

      if (workspaceId) {
        return NextResponse.json(await getActiveGraphPublicationForWorkspace(userId, workspaceId));
      }

      return NextResponse.json({ publication: null });
    }

    const viewerUserId = await getAuthenticatedUserId(request);
    const [publications, tags] = await Promise.all([
      listPublishedSnapshots({ sort, tag, viewerUserId }),
      listForestTags(),
    ]);

    return NextResponse.json({ publications, tags });
  } catch (error) {
    console.error("[GET /api/published-pages]", error);
    return NextResponse.json({ error: "Failed to fetch published pages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    const target = body.target === "graph" ? "graph" : "page";
    const description = body.description;
    const tags = normalizeTags(body.tags);
    const validationError = validatePublishedSnapshotInput(description, tags);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (target === "graph") {
      const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : null;
      const focusedPageId =
        typeof body.focusedPageId === "string" && body.focusedPageId.length > 0
          ? body.focusedPageId
          : null;

      if (!workspaceId) {
        return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
      }

      const workspace = await canUserAccessWorkspace(userId, workspaceId);
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }

      const publication = await createGraphPublication({
        userId,
        workspaceId,
        focusedPageId,
        description: description as string,
        tags,
      });

      return NextResponse.json({ publication }, { status: 201 });
    }

    const pageId = typeof body.pageId === "string" ? body.pageId : null;
    if (!pageId) {
      return NextResponse.json({ error: "pageId is required" }, { status: 400 });
    }

    const page = await canUserAccessPage(userId, pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const publication = await createPagePublication({
      userId,
      pageId: page.id,
      description: description as string,
      tags,
    });

    return NextResponse.json({ publication }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PAGE_NOT_FOUND") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error("[POST /api/published-pages]", error);
    return NextResponse.json({ error: "Failed to publish snapshot" }, { status: 500 });
  }
}
