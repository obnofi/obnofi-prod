import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { WorkspacePage } from "./WorkspacePage";
import { authOptions } from "@/lib/auth";
import { mockDb } from "@/lib/mock-db";

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

  const actualPageId = pageId || "page-1";

  // Pre-fetch data for the page and workspace
  const initialPage = mockDb.pages.get(actualPageId);
  const initialPages = mockDb.pages.getByWorkspace(workspaceId);

  return (
    <WorkspacePage
      workspaceId={workspaceId}
      pageId={actualPageId}
      initialPage={initialPage}
      initialPages={initialPages}
    />
  );
}
