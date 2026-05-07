import { redirect } from "next/navigation";
import { prisma } from "@obnofi/db";
import { pickProfileImagePreset } from "@/lib/profileImagePresets";
import { requireSessionUser } from "@/lib/requireSessionUser";
import { isPrismaDatabaseUnavailable } from "@/lib/prisma-errors";
import { DatabaseUnavailableState } from "@/components/workspace/DatabaseUnavailableState";

export default async function WorkspaceRootPage() {
  const sessionUser = await requireSessionUser();

  const userId = sessionUser.id;

  let membership;

  try {
    // DB 초기화 후 세션 쿠키가 남아있는 경우를 방어: User 레코드 보장
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: sessionUser.email!,
        name: sessionUser.name,
        image: pickProfileImagePreset(sessionUser.email ?? userId),
      },
    });

    membership = await prisma.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
      orderBy: { joinedAt: "asc" },
    });
  } catch (error) {
    if (isPrismaDatabaseUnavailable(error)) {
      return <DatabaseUnavailableState detail={(error as Error).message} />;
    }

    throw error;
  }

  if (membership) {
    redirect(`/workspace/${membership.workspaceId}`);
  }

  let workspace;

  try {
    // 워크스페이스가 없으면 기본 워크스페이스 생성
    workspace = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        slug: `ws-${userId}-${Date.now()}`,
        ownerId: userId,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (isPrismaDatabaseUnavailable(error)) {
      return <DatabaseUnavailableState detail={(error as Error).message} />;
    }

    throw error;
  }

  redirect(`/workspace/${workspace.id}`);
}
