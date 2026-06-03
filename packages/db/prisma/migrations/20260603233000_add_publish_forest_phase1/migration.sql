-- CreateEnum
CREATE TYPE "PublishedSnapshotType" AS ENUM ('PAGE', 'CANVAS', 'GRAPH');

-- CreateTable
CREATE TABLE "PublishedPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageId" TEXT,
    "workspaceId" TEXT,
    "snapshotType" "PublishedSnapshotType" NOT NULL,
    "snapshotContent" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PublishedPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedPageLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publishedPageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedPageLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublishedPage_userId_createdAt_idx" ON "PublishedPage"("userId", "createdAt");
CREATE INDEX "PublishedPage_pageId_idx" ON "PublishedPage"("pageId");
CREATE INDEX "PublishedPage_workspaceId_idx" ON "PublishedPage"("workspaceId");
CREATE INDEX "PublishedPage_snapshotType_createdAt_idx" ON "PublishedPage"("snapshotType", "createdAt");
CREATE INDEX "PublishedPage_deletedAt_createdAt_idx" ON "PublishedPage"("deletedAt", "createdAt");
CREATE UNIQUE INDEX "PublishedPageLike_userId_publishedPageId_key" ON "PublishedPageLike"("userId", "publishedPageId");
CREATE INDEX "PublishedPageLike_publishedPageId_createdAt_idx" ON "PublishedPageLike"("publishedPageId", "createdAt");

-- AddForeignKey
ALTER TABLE "PublishedPage" ADD CONSTRAINT "PublishedPage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PublishedPage" ADD CONSTRAINT "PublishedPage_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PublishedPageLike" ADD CONSTRAINT "PublishedPageLike_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PublishedPageLike" ADD CONSTRAINT "PublishedPageLike_publishedPageId_fkey"
    FOREIGN KEY ("publishedPageId") REFERENCES "PublishedPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "PublishedPage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PublishedPageLike" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published_pages_public_read"
ON "PublishedPage"
FOR SELECT
USING ("deletedAt" IS NULL);

CREATE POLICY "published_pages_owner_write"
ON "PublishedPage"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "published_page_likes_public_read"
ON "PublishedPageLike"
FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM "PublishedPage"
  WHERE "PublishedPage"."id" = "PublishedPageLike"."publishedPageId"
    AND "PublishedPage"."deletedAt" IS NULL
));

CREATE POLICY "published_page_likes_owner_write"
ON "PublishedPageLike"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (
  auth.uid()::text = "userId"
  AND EXISTS (
    SELECT 1
    FROM "PublishedPage"
    WHERE "PublishedPage"."id" = "PublishedPageLike"."publishedPageId"
      AND "PublishedPage"."deletedAt" IS NULL
  )
);
