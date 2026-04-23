import { WorkspaceGraphPage } from "./WorkspaceGraphPage";

interface WorkspaceGraphRouteProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceGraphRoute({
  params,
}: WorkspaceGraphRouteProps) {
  const { workspaceId } = await params;

  return <WorkspaceGraphPage workspaceId={workspaceId} />;
}
