import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import {
  isProfileImagePreset,
  pickProfileImagePreset,
} from "@/lib/profileImagePresets";
import { getSessionUserId } from "@/lib/request-auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      preferences: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    connectedAccounts: user.accounts.map((account) => account.provider),
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const nextName =
    typeof body?.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : null;
  const nextImage =
    typeof body?.image === "string" && body.image.trim().length > 0
      ? body.image.trim()
      : null;

  if (!nextName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (nextName.length > 80) {
    return NextResponse.json(
      { error: "Name must be 80 characters or fewer" },
      { status: 400 }
    );
  }

  if (nextImage && !isProfileImagePreset(nextImage)) {
    return NextResponse.json(
      { error: "Image must be one of the bundled profile presets" },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: nextName,
      image: nextImage ?? pickProfileImagePreset(userId),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      preferences: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...updatedUser,
    connectedAccounts: updatedUser.accounts.map((account) => account.provider),
  });
}
