import type { ReactNode } from "react";
import { requireSessionUser } from "@/lib/requireSessionUser";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default async function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  await requireSessionUser();

  return children;
}
