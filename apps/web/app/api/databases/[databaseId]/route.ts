import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import {
  PAGE_SELECT_WITH_PROPERTY_VALUES,
  toDatabase,
  toProperty,
  toView,
} from "@/lib/prisma-transforms";

import { logError } from "@/lib/logger";

const MAX_JUNGLE_ROW_LIMIT = 5000;

function getJungleRowLimit(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("jungleLimit");
  if (!rawLimit) {
    return undefined;
  }

  const limit = Number(rawLimit);
  if (!Number.isFinite(limit) || limit <= 0) {
    return undefined;
  }

  return Math.min(Math.floor(limit), MAX_JUNGLE_ROW_LIMIT);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const view = request.nextUrl.searchParams.get("view");

    if (view === "schema") {
      const database = await prisma.database.findUnique({
        where: { id: databaseId },
        include: {
          properties: { orderBy: { order: "asc" } },
          views: { orderBy: { order: "asc" } },
        },
      });

      if (!database) {
        return NextResponse.json({ error: "Database not found" }, { status: 404 });
      }

      const properties = database.properties.map(toProperty);
      return NextResponse.json({
        id: database.id,
        pageId: database.pageId,
        properties,
        columns: properties,
        rows: [],
        views: database.views.map(toView),
      });
    }

    const jungleRowLimit = getJungleRowLimit(request);
    const database = await prisma.database.findUnique({
      where: { id: databaseId },
      include: {
        properties: { orderBy: { order: "asc" } },
        views: { orderBy: { order: "asc" } },
        rows: {
          where: { parentDatabaseId: databaseId },
          select: PAGE_SELECT_WITH_PROPERTY_VALUES,
          ...(jungleRowLimit
            ? {
                take: jungleRowLimit,
                orderBy: [{ order: "asc" as const }, { updatedAt: "desc" as const }],
              }
            : {}),
        },
      },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json(toDatabase(database));
  } catch (error) {
    logError("GET /api/databases/[databaseId]", error);
    return NextResponse.json(
      { error: "Failed to fetch database" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;

    const existing = await prisma.database.findUnique({
      where: { id: databaseId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    // Cascades handle properties, views, and rows
    await prisma.database.delete({ where: { id: databaseId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/databases/[databaseId]", error);
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}
