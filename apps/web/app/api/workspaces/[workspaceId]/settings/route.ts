import { NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getSessionUserId } from "@/lib/request-auth";

type WorkspaceSettingsShape = {
  defaultPageVisibility?: "workspace" | "public_link" | "private";
  allowGuestAccess?: boolean;
};

export async function GET(
  _request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: params.workspaceId,
      userId,
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          settings: true,
          members: {
            orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
            select: {
              id: true,
              role: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const rawSettings =
    membership.workspace.settings &&
    typeof membership.workspace.settings === "object" &&
    !Array.isArray(membership.workspace.settings)
      ? (membership.workspace.settings as WorkspaceSettingsShape)
      : {};

  return NextResponse.json({
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      icon: membership.workspace.icon,
      ownerId: membership.workspace.ownerId,
      createdAt: membership.workspace.createdAt.toISOString(),
      updatedAt: membership.workspace.updatedAt.toISOString(),
      settings: {
        defaultPageVisibility:
          rawSettings.defaultPageVisibility ?? "workspace",
        allowGuestAccess: rawSettings.allowGuestAccess ?? false,
      },
    },
    viewerRole: membership.role,
    members: membership.workspace.members.map((member) => ({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      user: member.user,
    })),
  });
}
