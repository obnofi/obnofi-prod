import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getExampleDatabaseColumns } from "@/lib/database-utils";
import {
  getAuthenticatedUserId,
  resolveWorkspaceForUser,
} from "@/lib/workspace-resolution";
import {
  PAGE_INCLUDE,
  PAGE_GRAPH_SELECT,
  PAGE_SELECT,
  toPage,
  toPrismaPageType,
  toPrismaPropertyType,
  toPrismaViewType,
  type PrismaPageRow,
} from "@/lib/prisma-transforms";
import { normalizeTiptapDocument } from "@/lib/normalizeTiptapDocument";
import { jsonWithPrivateReadCache } from "@/lib/httpCache";

const PAGE_ORDER_STEP = 1024;

async function getNextSiblingOrder(workspaceId: string, parentId: string | null) {
  const lastSibling = await prisma.page.findFirst({
    where: {
      workspaceId,
      parentId,
      parentDatabaseId: null,
    },
    orderBy: [{ order: "desc" }, { updatedAt: "desc" }],
    select: { order: true },
  });

  return (lastSibling?.order ?? -PAGE_ORDER_STEP) + PAGE_ORDER_STEP;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");
    const includeContent = searchParams.get("includeContent") === "true";

    const workspace = await resolveWorkspaceForUser(userId, requestedWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const prismaPages = await prisma.page.findMany({
      where: { workspaceId: workspace.id, parentDatabaseId: null },
      select: includeContent ? PAGE_GRAPH_SELECT : PAGE_SELECT,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    });

    return jsonWithPrivateReadCache(prismaPages.map(toPage));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      type,
      parentId,
      workspaceId: requestedWorkspaceId,
      content,
    } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "title and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["document", "canvas", "database"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid page type" }, { status: 400 });
    }

    const workspace = await resolveWorkspaceForUser(userId, requestedWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const order = await getNextSiblingOrder(workspace.id, parentId || null);

    if (type === "database") {
      const defaultColumns = getExampleDatabaseColumns();

      const { page: newPage, databaseId } = await prisma.$transaction(
        async (tx) => {
          const page = await tx.page.create({
            data: {
              title,
              type: toPrismaPageType(type),
              parentId: parentId || null,
              order,
              workspaceId: workspace.id,
              isPublic: false,
            },
          });

          const database = await tx.database.create({
            data: { pageId: page.id },
          });

          await tx.property.createMany({
            data: defaultColumns.map((col, order) => ({
              databaseId: database.id,
              name: col.name,
              type: toPrismaPropertyType(col.type),
              options: col.options ? (col.options as object[]) : undefined,
              order,
            })),
          });

          await tx.view.create({
            data: {
              databaseId: database.id,
              name: "Table",
              type: toPrismaViewType("table"),
              order: 0,
            },
          });

          return { page, databaseId: database.id };
        },
        { maxWait: 15000, timeout: 30000 }
      );

      const result = toPage({ ...newPage, database: { id: databaseId } } as PrismaPageRow);
      return NextResponse.json(result, { status: 201 });
    }

    const newPage = await prisma.page.create({
      data: {
        title,
        type: toPrismaPageType(type),
        parentId: parentId || null,
        order,
        workspaceId: workspace.id,
        content:
          type === "document"
            ? normalizeTiptapDocument(
                content ?? { type: "doc", content: [{ type: "paragraph" }] }
              )
            : undefined,
        isPublic: false,
        collaborationEnabled: type === "document",
      },
      include: PAGE_INCLUDE,
    });

    return NextResponse.json(toPage(newPage), { status: 201 });
  } catch (e) {
    console.error("[POST /api/pages]", e);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
