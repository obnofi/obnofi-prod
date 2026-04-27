import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { WorkspacePage } from "./WorkspacePage";
import { authOptions } from "@/lib/auth";
import { prisma } from "@obnofi/db";
import { toPage, PAGE_INCLUDE } from "@/lib/prisma-transforms";

interface WorkspacePageRouteProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function WorkspacePageRoute({
  params,
  searchParams,
}: WorkspacePageRouteProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { workspaceId } = await params;
  const { page: pageId } = await searchParams;

  // 워크스페이스가 실제 존재하는지 확인 (잘못된 URL 방어)
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (!workspace) {
    redirect("/workspace");
  }

  const prismaPages = await prisma.page.findMany({
    where: { workspaceId, parentDatabaseId: null },
    include: PAGE_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });

  const initialPages = prismaPages.map(toPage);
  const actualPageId = pageId ?? initialPages[0]?.id;

  if (!actualPageId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--color-background)] text-[var(--color-text-secondary)]">
        <span className="text-[15px]">페이지가 없습니다</span>
        <span className="text-[13px]">사이드바에서 새 페이지를 만들어 시작하세요</span>
      </div>
    );
  }

  const initialPage = initialPages.find((p) => p.id === actualPageId);

  return (
    <WorkspacePage
      workspaceId={workspaceId}
      pageId={actualPageId}
      initialPage={initialPage}
      initialPages={initialPages}
    />
  );
}
