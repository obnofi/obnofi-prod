import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@obnofi/db";
import { pickProfileImagePreset } from "@/lib/profileImagePresets";

export default async function WorkspaceRootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // DB 초기화 후 세션 쿠키가 남아있는 경우를 방어: User 레코드 보장
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      image: pickProfileImagePreset(session.user.email ?? userId),
    },
    create: {
      id: userId,
      email: session.user.email!,
      name: session.user.name,
      image: pickProfileImagePreset(session.user.email ?? userId),
    },
  });

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
    orderBy: { joinedAt: "asc" },
  });

  if (membership) {
    redirect(`/workspace/${membership.workspaceId}`);
  }

  // 워크스페이스가 없으면 기본 워크스페이스 생성
  const workspace = await prisma.workspace.create({
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

  redirect(`/workspace/${workspace.id}`);
}
