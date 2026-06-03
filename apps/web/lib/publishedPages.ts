import { PublishedSnapshotType as PrismaPublishedSnapshotType, prisma } from "@obnofi/db";
import { resolvePersistedYjsContent } from "@/lib/yjsContent";
import { createGraphFromPages } from "@/lib/graph/graphDataUtils";
import { toPage } from "@/lib/prisma-transforms";
import { PAGE_GRAPH_SELECT } from "@/lib/prisma/selects";
import type {
  PublishedGraphSnapshotContent,
  PublishedPageSnapshotContent,
  PublishedSnapshotDetail,
  PublishedSnapshotManageResponse,
  PublishedSnapshotSummary,
  PublishedSnapshotType,
} from "@/lib/publishedPageTypes";

const MAX_TAGS = 5;
const MAX_DESCRIPTION_LENGTH = 160;
const PUBLISHED_SNAPSHOT_TYPE = {
  PAGE: "PAGE",
  CANVAS: "CANVAS",
  GRAPH: "GRAPH",
} as const;

type PersistedPublishedSnapshotType =
  | PrismaPublishedSnapshotType
  | (typeof PUBLISHED_SNAPSHOT_TYPE)[keyof typeof PUBLISHED_SNAPSHOT_TYPE];

type PublishedSnapshotRow = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  likeCount: number;
  createdAt: Date;
  snapshotType: PersistedPublishedSnapshotType;
  pageId: string | null;
  workspaceId: string | null;
  deletedAt?: Date | null;
  snapshotContent: PublishedPageSnapshotContent | PublishedGraphSnapshotContent;
  userId: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  likes: Array<{ userId: string }>;
};

const publishedPageDelegate = (prisma as typeof prisma & {
  publishedPage?: {
    findFirst?: (...args: unknown[]) => Promise<unknown>;
    findMany?: (...args: unknown[]) => Promise<unknown>;
    updateMany?: (...args: unknown[]) => Promise<unknown>;
    create?: (...args: unknown[]) => Promise<unknown>;
    update?: (...args: unknown[]) => Promise<unknown>;
  };
  publishedPageLike?: {
    upsert?: (...args: unknown[]) => Promise<unknown>;
    deleteMany?: (...args: unknown[]) => Promise<unknown>;
    count?: (...args: unknown[]) => Promise<unknown>;
  };
}).publishedPage;

function hasPublishedPagesRuntime() {
  return Boolean(
    publishedPageDelegate?.findMany &&
      publishedPageDelegate?.findFirst &&
      publishedPageDelegate?.create &&
      prisma.publishedPageLike
  );
}

function createMockPublishedSnapshotRow(input: {
  id: string;
  title: string;
  description: string;
  tags: string[];
  likeCount: number;
  createdAt: string;
  snapshotType: PersistedPublishedSnapshotType;
  pageId: string | null;
  workspaceId: string | null;
  snapshotContent: PublishedPageSnapshotContent | PublishedGraphSnapshotContent;
  user: { id: string; name: string | null; email: string; image: string | null };
  likes?: Array<{ userId: string }>;
}): PublishedSnapshotRow {
  return {
    ...input,
    createdAt: new Date(input.createdAt),
    deletedAt: null,
    userId: input.user.id,
    likes: input.likes ?? [],
  };
}

const globalForPublishedPages = globalThis as typeof globalThis & {
  __obnofiPublishedPagesMockStore?: PublishedSnapshotRow[];
};

function getMockPublishedPagesStore() {
  if (!globalForPublishedPages.__obnofiPublishedPagesMockStore) {
    globalForPublishedPages.__obnofiPublishedPagesMockStore = [
      createMockPublishedSnapshotRow({
        id: "forest-demo-page",
        title: "Jungle Weekly Review",
        description: "한 주 동안 정리한 Grove 회고 snapshot입니다.",
        tags: ["weekly", "grove", "notes"],
        likeCount: 7,
        createdAt: "2026-06-03T09:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-1",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          title: "Jungle Weekly Review",
          icon: "🌿",
          coverImage: null,
          updatedAt: "2026-06-03T08:40:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "이번 주 회고" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Forest mock snapshot입니다. Prisma PublishedPage delegate가 없는 환경에서도 화면 확인이 가능합니다.",
                  },
                ],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "제품 구조 정리" }] }],
                  },
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "캔버스 퍼블리시 플로우 점검" }] }],
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "demo-user-1",
          name: "Canopy",
          email: "canopy@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-canvas",
        title: "Clearing Sprint Map",
        description: "이번 스프린트용 Clearing 보드 snapshot입니다.",
        tags: ["canvas", "sprint", "planning"],
        likeCount: 12,
        createdAt: "2026-06-02T12:30:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.CANVAS,
        pageId: "demo-page-2",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          title: "Clearing Sprint Map",
          icon: null,
          coverImage: null,
          updatedAt: "2026-06-02T12:10:00.000Z",
          pageType: "canvas",
          content: {
            version: 2,
            layers: [
              {
                id: "shape-1",
                kind: "rectangle",
                x: 120,
                y: 120,
                width: 220,
                height: 120,
                stroke: "#2E7D45",
                fill: "#E8F5EC",
                radius: 24,
              },
              {
                id: "shape-2",
                kind: "ellipse",
                x: 430,
                y: 220,
                width: 180,
                height: 120,
                stroke: "#337EA9",
                fill: "#DDEBF1",
              },
            ],
          },
        },
        user: {
          id: "demo-user-2",
          name: "Moss",
          email: "moss@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-graph",
        title: "Workspace Graph View",
        description: "문서 연결 구조를 공유하는 Graph snapshot입니다.",
        tags: ["graph", "wiki"],
        likeCount: 4,
        createdAt: "2026-06-01T16:20:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
        pageId: "demo-page-3",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          workspaceId: "demo-workspace-1",
          focusedPageId: "demo-page-3",
          nodes: [
            { id: "demo-page-1", title: "Review", x: 0, y: 0, size: 1, degree: 2, isFocused: false },
            { id: "demo-page-2", title: "Planning", x: 120, y: 40, size: 1, degree: 2, isFocused: false },
            { id: "demo-page-3", title: "Architecture", x: 50, y: 160, size: 1.2, degree: 3, isFocused: true },
          ],
          edges: [
            { source: "demo-page-1", target: "demo-page-3", thickness: 1.1, isUnresolved: false },
            { source: "demo-page-2", target: "demo-page-3", thickness: 0.9, isUnresolved: false },
          ],
        },
        user: {
          id: "demo-user-3",
          name: "Vine",
          email: "vine@obnofi.local",
          image: null,
        },
      }),
    ];
  }

  return globalForPublishedPages.__obnofiPublishedPagesMockStore;
}

function getActiveMockRows() {
  return getMockPublishedPagesStore().filter((row) => !row.deletedAt);
}

function getMockPublishedSnapshotSummary(
  row: PublishedSnapshotRow,
  viewerUserId?: string | null
) {
  return toPublishedSnapshotSummary(
    {
      id: row.id,
      title: row.title,
      description: row.description,
      tags: row.tags,
      likeCount: row.likeCount,
      createdAt: row.createdAt,
      snapshotType: row.snapshotType,
      pageId: row.pageId,
      workspaceId: row.workspaceId,
      user: row.user,
      likes: row.likes,
    },
    viewerUserId
  );
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of input) {
    if (typeof rawTag !== "string") {
      continue;
    }
    const normalized = rawTag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    tags.push(normalized);
    if (tags.length >= MAX_TAGS) {
      break;
    }
  }

  return tags;
}

export function validatePublishedSnapshotInput(description: unknown, tags: unknown) {
  if (typeof description !== "string" || !description.trim()) {
    return "description is required";
  }

  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    return `description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`;
  }

  const normalizedTags = normalizeTags(tags);
  if (Array.isArray(tags) && normalizedTags.length !== tags.filter((tag) => typeof tag === "string" && tag.trim()).length) {
    // Duplicates and empty values are normalized away. That is allowed.
  }

  if (Array.isArray(tags) && tags.length > MAX_TAGS) {
    return `tags must contain at most ${MAX_TAGS} items`;
  }

  return null;
}

function resolveAuthorName(user: { name: string | null; email: string; image: string | null; id: string }) {
  const fallback = user.email.split("@")[0]?.trim();
  return {
    id: user.id,
    name: user.name?.trim() || fallback || "anonymous",
    image: user.image ?? null,
  };
}

function fromPrismaPublishedSnapshotType(value: PersistedPublishedSnapshotType): PublishedSnapshotType {
  return value.toLowerCase() as PublishedSnapshotType;
}

function toPublishedSnapshotSummary(
  row: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    likeCount: number;
    createdAt: Date;
    snapshotType: PersistedPublishedSnapshotType;
    pageId: string | null;
    workspaceId: string | null;
    user: { id: string; name: string | null; email: string; image: string | null };
    likes?: Array<{ userId: string }>;
  },
  viewerUserId?: string | null
): PublishedSnapshotSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    likeCount: row.likeCount,
    createdAt: row.createdAt.toISOString(),
    snapshotType: fromPrismaPublishedSnapshotType(row.snapshotType),
    author: resolveAuthorName(row.user),
    pageId: row.pageId,
    workspaceId: row.workspaceId,
    viewerHasLiked: Boolean(viewerUserId && row.likes?.some((like) => like.userId === viewerUserId)),
  };
}

export async function getActivePublicationForPage(
  userId: string,
  pageId: string
): Promise<PublishedSnapshotManageResponse> {
  if (!hasPublishedPagesRuntime()) {
    const publication = getActiveMockRows()
      .filter((row) => row.userId === userId && row.pageId === pageId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .find((row) =>
        row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.PAGE ||
        row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.CANVAS
      );

    return {
      publication: publication ? getMockPublishedSnapshotSummary(publication, userId) : null,
    };
  }

  const publication = await prisma.publishedPage.findFirst({
    where: {
      userId,
      pageId,
      deletedAt: null,
      snapshotType: { in: [PUBLISHED_SNAPSHOT_TYPE.PAGE, PUBLISHED_SNAPSHOT_TYPE.CANVAS] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      likeCount: true,
      createdAt: true,
      snapshotType: true,
      pageId: true,
      workspaceId: true,
      user: { select: { id: true, name: true, email: true, image: true } },
      likes: { select: { userId: true }, where: { userId } },
    },
  });

  return {
    publication: publication ? toPublishedSnapshotSummary(publication, userId) : null,
  };
}

export async function getActiveGraphPublicationForWorkspace(
  userId: string,
  workspaceId: string
): Promise<PublishedSnapshotManageResponse> {
  if (!hasPublishedPagesRuntime()) {
    const publication = getActiveMockRows()
      .filter(
        (row) =>
          row.userId === userId &&
          row.workspaceId === workspaceId &&
          row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.GRAPH
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

    return {
      publication: publication ? getMockPublishedSnapshotSummary(publication, userId) : null,
    };
  }

  const publication = await prisma.publishedPage.findFirst({
    where: {
      userId,
      workspaceId,
      deletedAt: null,
      snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      likeCount: true,
      createdAt: true,
      snapshotType: true,
      pageId: true,
      workspaceId: true,
      user: { select: { id: true, name: true, email: true, image: true } },
      likes: { select: { userId: true }, where: { userId } },
    },
  });

  return {
    publication: publication ? toPublishedSnapshotSummary(publication, userId) : null,
  };
}

export async function listPublishedSnapshots(options: {
  sort?: "latest" | "popular";
  tag?: string | null;
  viewerUserId?: string | null;
}): Promise<PublishedSnapshotSummary[]> {
  if (!hasPublishedPagesRuntime()) {
    const tag = options.tag?.toLowerCase() ?? null;
    const rows = getActiveMockRows()
      .filter((row) => (tag ? row.tags.includes(tag) : true))
      .sort((left, right) => {
        if (options.sort === "popular" && right.likeCount !== left.likeCount) {
          return right.likeCount - left.likeCount;
        }
        return right.createdAt.getTime() - left.createdAt.getTime();
      })
      .slice(0, 100);

    return rows.map((row) => getMockPublishedSnapshotSummary(row, options.viewerUserId));
  }

  const rows = await prisma.publishedPage.findMany({
    where: {
      deletedAt: null,
      ...(options.tag ? { tags: { has: options.tag.toLowerCase() } } : {}),
    },
    orderBy:
      options.sort === "popular"
        ? [{ likeCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      likeCount: true,
      createdAt: true,
      snapshotType: true,
      pageId: true,
      workspaceId: true,
      user: { select: { id: true, name: true, email: true, image: true } },
      likes: options.viewerUserId
        ? { where: { userId: options.viewerUserId }, select: { userId: true } }
        : false,
    },
  });

  return rows.map((row) => toPublishedSnapshotSummary(row, options.viewerUserId));
}

export async function getPublishedSnapshotDetail(
  publishId: string,
  viewerUserId?: string | null
): Promise<PublishedSnapshotDetail | null> {
  if (!hasPublishedPagesRuntime()) {
    const row = getActiveMockRows().find((item) => item.id === publishId);
    if (!row) {
      return null;
    }

    return {
      ...getMockPublishedSnapshotSummary(row, viewerUserId),
      snapshotContent: row.snapshotContent,
    };
  }

  const row = await prisma.publishedPage.findFirst({
    where: { id: publishId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      likeCount: true,
      createdAt: true,
      snapshotType: true,
      pageId: true,
      workspaceId: true,
      snapshotContent: true,
      user: { select: { id: true, name: true, email: true, image: true } },
      likes: viewerUserId
        ? { where: { userId: viewerUserId }, select: { userId: true } }
        : false,
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...toPublishedSnapshotSummary(row, viewerUserId),
    snapshotContent: row.snapshotContent as PublishedPageSnapshotContent | PublishedGraphSnapshotContent,
  };
}

export async function createPagePublication(options: {
  userId: string;
  pageId: string;
  description: string;
  tags: string[];
}) {
  const page = await prisma.page.findFirst({
    where: { id: options.pageId },
    select: {
      id: true,
      title: true,
      icon: true,
      coverImage: true,
      content: true,
      type: true,
      workspaceId: true,
      updatedAt: true,
      yjsDocument: { select: { state: true, updatedAt: true } },
    },
  });

  if (!page) {
    throw new Error("PAGE_NOT_FOUND");
  }

  const snapshotType =
    page.type === "CANVAS"
      ? PUBLISHED_SNAPSHOT_TYPE.CANVAS
      : PUBLISHED_SNAPSHOT_TYPE.PAGE;
  const latestContent =
    page.type === "DOCUMENT"
      ? resolvePersistedYjsContent(page.yjsDocument?.state) ?? (page.content as object | null)
      : (page.content as object | null);
  const latestUpdatedAt =
    page.yjsDocument?.updatedAt &&
    page.yjsDocument.updatedAt.getTime() > page.updatedAt.getTime()
      ? page.yjsDocument.updatedAt
      : page.updatedAt;

  const snapshotContent: PublishedPageSnapshotContent = {
    title: page.title,
    icon: page.icon ?? null,
    coverImage: page.coverImage ?? null,
    content: latestContent ?? null,
    updatedAt: latestUpdatedAt.toISOString(),
    pageType: page.type.toLowerCase() as PublishedPageSnapshotContent["pageType"],
  };

  if (!hasPublishedPagesRuntime()) {
    const store = getMockPublishedPagesStore();
    const deletedAt = new Date();
    for (const row of store) {
      if (row.userId === options.userId && row.pageId === options.pageId && !row.deletedAt) {
        row.deletedAt = deletedAt;
      }
    }

    const created: PublishedSnapshotRow = {
      id: `mock-publish-${Date.now()}`,
      userId: options.userId,
      pageId: page.id,
      workspaceId: page.workspaceId,
      snapshotType,
      snapshotContent,
      title: page.title,
      description: options.description.trim(),
      tags: normalizeTags(options.tags),
      likeCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      user: {
        id: options.userId,
        name: "You",
        email: "you@obnofi.local",
        image: null,
      },
      likes: [],
    };
    store.unshift(created);

    return getMockPublishedSnapshotSummary(created, options.userId);
  }

  return prisma.$transaction(async (tx) => {
    await tx.publishedPage.updateMany({
      where: {
        userId: options.userId,
        pageId: options.pageId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    const created = await tx.publishedPage.create({
      data: {
        userId: options.userId,
        pageId: page.id,
        workspaceId: page.workspaceId,
        snapshotType,
        snapshotContent,
        title: page.title,
        description: options.description.trim(),
        tags: normalizeTags(options.tags),
      },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        likeCount: true,
        createdAt: true,
        snapshotType: true,
        pageId: true,
        workspaceId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        likes: { where: { userId: options.userId }, select: { userId: true } },
      },
    });

    return toPublishedSnapshotSummary(created, options.userId);
  });
}

export async function createGraphPublication(options: {
  userId: string;
  workspaceId: string;
  focusedPageId: string | null;
  description: string;
  tags: string[];
}) {
  const prismaPages = await prisma.page.findMany({
    where: { workspaceId: options.workspaceId, parentDatabaseId: null },
    select: PAGE_GRAPH_SELECT,
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
  });

  const pages = prismaPages.map(toPage);
  const graphData = createGraphFromPages(pages, options.focusedPageId);
  const snapshotContent: PublishedGraphSnapshotContent = {
    workspaceId: options.workspaceId,
    focusedPageId: options.focusedPageId,
    nodes: graphData.allNodes,
    edges: graphData.allEdges,
  };

  const focusPage = options.focusedPageId
    ? pages.find((page) => page.id === options.focusedPageId)
    : null;
  const title = focusPage ? `${focusPage.title || "Untitled"} Graph View` : "Workspace Graph View";

  if (!hasPublishedPagesRuntime()) {
    const store = getMockPublishedPagesStore();
    const deletedAt = new Date();
    for (const row of store) {
      if (
        row.userId === options.userId &&
        row.workspaceId === options.workspaceId &&
        row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.GRAPH &&
        !row.deletedAt
      ) {
        row.deletedAt = deletedAt;
      }
    }

    const created: PublishedSnapshotRow = {
      id: `mock-publish-${Date.now()}`,
      userId: options.userId,
      workspaceId: options.workspaceId,
      pageId: options.focusedPageId,
      snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
      snapshotContent,
      title,
      description: options.description.trim(),
      tags: normalizeTags(options.tags),
      likeCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      user: {
        id: options.userId,
        name: "You",
        email: "you@obnofi.local",
        image: null,
      },
      likes: [],
    };
    store.unshift(created);

    return getMockPublishedSnapshotSummary(created, options.userId);
  }

  return prisma.$transaction(async (tx) => {
    await tx.publishedPage.updateMany({
      where: {
        userId: options.userId,
        workspaceId: options.workspaceId,
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    const created = await tx.publishedPage.create({
      data: {
        userId: options.userId,
        workspaceId: options.workspaceId,
        pageId: options.focusedPageId,
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
        snapshotContent,
        title,
        description: options.description.trim(),
        tags: normalizeTags(options.tags),
      },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        likeCount: true,
        createdAt: true,
        snapshotType: true,
        pageId: true,
        workspaceId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        likes: { where: { userId: options.userId }, select: { userId: true } },
      },
    });

    return toPublishedSnapshotSummary(created, options.userId);
  });
}

export async function softDeletePublication(publishId: string, userId: string) {
  if (!hasPublishedPagesRuntime()) {
    const row = getMockPublishedPagesStore().find(
      (item) => item.id === publishId && item.userId === userId && !item.deletedAt
    );
    if (!row) {
      return false;
    }
    row.deletedAt = new Date();
    return true;
  }

  const updated = await prisma.publishedPage.updateMany({
    where: { id: publishId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return updated.count > 0;
}

export async function togglePublicationLike(publishId: string, userId: string, shouldLike: boolean) {
  if (!hasPublishedPagesRuntime()) {
    const row = getActiveMockRows().find((item) => item.id === publishId);
    if (!row) {
      return null;
    }

    const hasLike = row.likes.some((like) => like.userId === userId);
    if (shouldLike && !hasLike) {
      row.likes.push({ userId });
    }
    if (!shouldLike && hasLike) {
      row.likes = row.likes.filter((like) => like.userId !== userId);
    }
    row.likeCount = row.likes.length;

    return {
      ...getMockPublishedSnapshotSummary(row, userId),
      snapshotContent: row.snapshotContent,
    };
  }

  const publication = await prisma.publishedPage.findFirst({
    where: { id: publishId, deletedAt: null },
    select: { id: true },
  });

  if (!publication) {
    return null;
  }

  await prisma.$transaction(async (tx) => {
    if (shouldLike) {
      await tx.publishedPageLike.upsert({
        where: {
          userId_publishedPageId: {
            userId,
            publishedPageId: publishId,
          },
        },
        update: {},
        create: {
          userId,
          publishedPageId: publishId,
        },
      });
    } else {
      await tx.publishedPageLike.deleteMany({
        where: {
          userId,
          publishedPageId: publishId,
        },
      });
    }

    const likeCount = await tx.publishedPageLike.count({
      where: { publishedPageId: publishId },
    });

    await tx.publishedPage.update({
      where: { id: publishId },
      data: { likeCount },
    });
  });

  return getPublishedSnapshotDetail(publishId, userId);
}

export async function canUserAccessPage(userId: string, pageId: string) {
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      workspace: {
        members: {
          some: { userId },
        },
      },
    },
    select: { id: true, workspaceId: true },
  });

  return page;
}

export async function canUserAccessWorkspace(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: { userId },
      },
    },
    select: { id: true },
  });

  return workspace;
}

export async function listForestTags() {
  if (!hasPublishedPagesRuntime()) {
    return Array.from(
      new Set(getActiveMockRows().flatMap((row) => row.tags).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }

  const rows = await prisma.publishedPage.findMany({
    where: { deletedAt: null },
    select: { tags: true },
    take: 200,
  });

  return Array.from(
    new Set(rows.flatMap((row) => row.tags).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export { normalizeTags };
