import { ClearingBoard } from "@/components/canvas/ClearingBoard";
import { requireSessionUser } from "@/lib/requireSessionUser";

export default async function ClearingPage() {
  await requireSessionUser();

  return <ClearingBoard roomSlug="jungle-clearing" />;
}
