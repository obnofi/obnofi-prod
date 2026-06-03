import { notFound } from "next/navigation";
import { PublishedSnapshotView } from "@/components/published/PublishedSnapshotView";
import { getPublishedSnapshotDetail } from "@/lib/publishedPages";
import { getSessionUserId } from "@/lib/request-auth";

interface PublishedSnapshotPageProps {
  params: Promise<{ publishId: string }>;
}

export default async function PublishedSnapshotPage({
  params,
}: PublishedSnapshotPageProps) {
  const { publishId } = await params;
  const viewerUserId = await getSessionUserId();
  const publication = await getPublishedSnapshotDetail(publishId, viewerUserId);

  if (!publication) {
    notFound();
  }

  return <PublishedSnapshotView publication={publication} />;
}
