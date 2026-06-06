import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import {
  PAGE_SELECT_WITH_PROPERTY_VALUES,
  toDatabase,
  toPrismaViewType,
} from "@/lib/prisma-transforms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    // Check page existence and existing database in parallel
    const [page, existingDb] = await Promise.all([
      prisma.page.findUnique({ where: { id: pageId }, select: { id: true } }),
      prisma.database.findUnique({ where: { pageId }, select: { id: true } }),
    ]);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (existingDb) {
      const fullDb = await prisma.database.findUnique({
        where: { id: existingDb.id },
        include: {
          properties: { orderBy: { order: "asc" } },
          views: { orderBy: { order: "asc" } },
          rows: {
            where: { parentDatabaseId: existingDb.id },
            select: PAGE_SELECT_WITH_PROPERTY_VALUES,
          },
        },
      });
      return NextResponse.json(toDatabase(fullDb!));
    }

    const fullDb = await prisma.$transaction(async (tx) => {
      const newDb = await tx.database.create({ data: { pageId } });

      await tx.view.create({
        data: {
          databaseId: newDb.id,
          name: "Table",
          type: toPrismaViewType("table"),
          order: 0,
        },
      });

      // Fetch full result inside transaction — avoids extra round-trip after commit
      return tx.database.findUnique({
        where: { id: newDb.id },
        include: {
          properties: { orderBy: { order: "asc" } },
          views: { orderBy: { order: "asc" } },
          rows: { select: PAGE_SELECT_WITH_PROPERTY_VALUES },
        },
      });
    });

    return NextResponse.json(toDatabase(fullDb!), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create database" },
      { status: 500 }
    );
  }
}
