import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import type {
  GroveTitleLevel,
  HeadingLevel,
  PageHighlightColor,
} from "@obnofi/types";
import {
  PAGE_INCLUDE,
  PAGE_SELECT_WITH_PROPERTY_VALUES,
  toPage,
  toDatabase,
} from "@/lib/prisma-transforms";
import { normalizeTiptapDocument } from "@/lib/normalizeTiptapDocument";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const view = request.nextUrl.searchParams.get("view");

    if (view === "full") {
      // Database.pageId is @unique — query page and database in parallel
      const [page, database] = await Promise.all([
        prisma.page.findUnique({ where: { id: pageId }, include: PAGE_INCLUDE }),
        prisma.database.findUnique({
          where: { pageId },
          include: {
            properties: { orderBy: { order: "asc" } },
            views: { orderBy: { order: "asc" } },
            rows: {
              // content 제외 — DB 테이블/보드 뷰에서 문서 본문 불필요
              select: PAGE_SELECT_WITH_PROPERTY_VALUES,
            },
          },
        }),
      ]);

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      if (page.type !== "DATABASE" || !database) {
        return NextResponse.json(
          { error: "Not a database page" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ...toPage(page),
        database: toDatabase(database),
      });
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: PAGE_INCLUDE,
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(toPage(page));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const body = await request.json();
    const nextGroveTitleLevel = body.groveTitleLevel;
    const nextBodyFontSizePt = body.bodyFontSizePt;
    const nextHeadingFontSizes = body.headingFontSizes;
    const nextHighlightColors = body.highlightColors;
    const allowedHighlightColors: PageHighlightColor[] = [
      "yellow",
      "green",
      "blue",
      "purple",
      "pink",
      "red",
      "orange",
    ];

    if (
      "groveTitleLevel" in body &&
      ![1, 2, 3, 4, 5].includes(nextGroveTitleLevel)
    ) {
      return NextResponse.json(
        { error: "groveTitleLevel must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (
      "bodyFontSizePt" in body &&
      (!Number.isInteger(nextBodyFontSizePt) ||
        nextBodyFontSizePt < 8 ||
        nextBodyFontSizePt > 32)
    ) {
      return NextResponse.json(
        { error: "bodyFontSizePt must be an integer between 8 and 32" },
        { status: 400 }
      );
    }

    if ("headingFontSizes" in body) {
      const headingEntries = Object.entries(
        (nextHeadingFontSizes ?? {}) as Record<string, unknown>
      );

      const hasInvalidHeadingSize = headingEntries.some(([, value]) => {
        return !Number.isInteger(value) || Number(value) < 8 || Number(value) > 48;
      });

      const hasInvalidHeadingKey = headingEntries.some(([key]) => {
        return !["h1", "h2", "h3", "h4", "h5"].includes(key);
      });

      if (hasInvalidHeadingKey || hasInvalidHeadingSize) {
        return NextResponse.json(
          { error: "headingFontSizes must contain h1~h5 integers between 8 and 48" },
          { status: 400 }
        );
      }
    }

    if ("highlightColors" in body) {
      const isValidHighlightColors =
        Array.isArray(nextHighlightColors) &&
        nextHighlightColors.length > 0 &&
        nextHighlightColors.every((color) =>
          allowedHighlightColors.includes(color as PageHighlightColor)
        );

      if (!isValidHighlightColors) {
        return NextResponse.json(
          { error: "highlightColors must be a non-empty array of allowed colors" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if ("title" in body) updateData.title = body.title;
    if ("groveTitleLevel" in body) {
      updateData.groveTitleLevel = nextGroveTitleLevel as GroveTitleLevel;
    }
    if ("bodyFontSizePt" in body) updateData.bodyFontSizePt = nextBodyFontSizePt;
    if ("headingFontSizes" in body) {
      const headingFontSizes = nextHeadingFontSizes as Partial<
        Record<`h${HeadingLevel}`, number>
      >;
      if ("h1" in headingFontSizes) updateData.heading1FontSizePt = headingFontSizes.h1;
      if ("h2" in headingFontSizes) updateData.heading2FontSizePt = headingFontSizes.h2;
      if ("h3" in headingFontSizes) updateData.heading3FontSizePt = headingFontSizes.h3;
      if ("h4" in headingFontSizes) updateData.heading4FontSizePt = headingFontSizes.h4;
      if ("h5" in headingFontSizes) updateData.heading5FontSizePt = headingFontSizes.h5;
    }
    if ("highlightColors" in body) updateData.highlightColors = nextHighlightColors;
    if ("content" in body) {
      updateData.content = normalizeTiptapDocument(body.content);
    }
    if ("icon" in body) updateData.icon = body.icon;
    if ("coverImage" in body) updateData.coverImage = body.coverImage;
    if ("parentId" in body) updateData.parentId = body.parentId;
    if ("order" in body) updateData.order = body.order;
    if ("isPublic" in body) updateData.isPublic = body.isPublic;

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: updateData,
      include: PAGE_INCLUDE,
    });

    return NextResponse.json(toPage(updatedPage));
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error("[PATCH /api/pages/[pageId]]", e);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    const existing = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Cascades handle children / database / propertyValues
    await prisma.page.delete({ where: { id: pageId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
