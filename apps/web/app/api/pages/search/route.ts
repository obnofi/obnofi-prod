import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getSearchSnippet, matchesSearch, resolveSearchableContent, type PageSearchMode } from "@/lib/page-search";
import {
  getAuthenticatedUserId,
  resolveWorkspaceForUser,
} from "@/lib/workspace-resolution";

export const dynamic = "force-dynamic";

const TITLE_ONLY_SELECT = {
  id: true,
  title: true,
  type: true,
  icon: true,
  parentId: true,
  updatedAt: true,
} as const;

const CONTENT_SELECT = {
  ...TITLE_ONLY_SELECT,
  content: true,
  yjsDocument: { select: { state: true } },
} as const;

const VALID_SEARCH_MODES: PageSearchMode[] = ["title", "content", "title_content"];

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");
    const query = searchParams.get("q")?.trim() ?? "";
    const modeParam = searchParams.get("mode") ?? "title_content";
    const mode = VALID_SEARCH_MODES.includes(modeParam as PageSearchMode)
      ? (modeParam as PageSearchMode)
      : "title_content";

    const workspace = await resolveWorkspaceForUser(userId, requestedWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (!query) {
      return NextResponse.json([]);
    }

    // title 모드: DB 레벨에서 필터링, content/yjsDocument 로드 불필요
    if (mode === "title") {
      const pages = await prisma.page.findMany({
        where: {
          workspaceId: workspace.id,
          parentDatabaseId: null,
          title: { contains: query, mode: "insensitive" },
        },
        select: TITLE_ONLY_SELECT,
        orderBy: [{ updatedAt: "desc" }],
        take: 30,
      });

      return NextResponse.json(
        pages.map((page) => ({
          id: page.id,
          title: page.title,
          type: page.type.toLowerCase(),
          icon: page.icon ?? null,
          parentId: page.parentId,
          updatedAt: page.updatedAt.toISOString(),
          snippet: "",
          matchedIn: "title",
        }))
      );
    }

    // content / title_content 모드: 본문 포함 로드 후 앱 레벨 필터링
    const candidatePages = await prisma.page.findMany({
      where: { workspaceId: workspace.id, parentDatabaseId: null },
      select: CONTENT_SELECT,
      orderBy: [{ updatedAt: "desc" }],
      take: 250,
    });

    const results = candidatePages
      .map((page) => {
        const contentText = resolveSearchableContent({
          content: page.content,
          yjsState: page.yjsDocument?.state,
        });

        if (!matchesSearch({ query, title: page.title, content: contentText, mode })) {
          return null;
        }

        const titleMatches = page.title.toLowerCase().includes(query.toLowerCase());
        const contentMatches = contentText.toLowerCase().includes(query.toLowerCase());

        return {
          id: page.id,
          title: page.title,
          type: page.type.toLowerCase(),
          icon: page.icon ?? null,
          parentId: page.parentId,
          updatedAt: page.updatedAt.toISOString(),
          snippet: getSearchSnippet(contentText, query),
          matchedIn: (
            titleMatches && contentMatches ? "title_content"
            : titleMatches ? "title"
            : "content"
          ) as "title_content" | "title" | "content",
          score: (titleMatches ? 10 : 0) + (contentMatches ? 3 : 0),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 30)
      .map(({ id, title, type, icon, parentId, updatedAt, snippet, matchedIn }) => ({
        id,
        title,
        type,
        icon,
        parentId,
        updatedAt,
        snippet,
        matchedIn,
      }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET /api/pages/search]", error);
    return NextResponse.json(
      { error: "Failed to search pages" },
      { status: 500 }
    );
  }
}
