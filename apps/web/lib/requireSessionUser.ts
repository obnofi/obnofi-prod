import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireSessionUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  return session.user;
}
