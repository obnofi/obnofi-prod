import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function WorkspaceRootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // 임시: 첫 워크스페이스로 리다이렉트 (mock)
  redirect("/workspace/ws-1");
}
