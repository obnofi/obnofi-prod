import { ForestFeedClient } from "@/components/published/ForestFeedClient";
import { listForestTags, listPublishedSnapshots } from "@/lib/publishedPages";
import { getSessionUserId } from "@/lib/request-auth";

interface ForestPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ForestPage({
  searchParams,
}: ForestPageProps) {
  const resolved = await searchParams;
  const sort = resolved.sort === "popular" ? "popular" : "latest";
  const tag = typeof resolved.tag === "string" ? resolved.tag : null;
  const viewerUserId = await getSessionUserId();
  const [publications, tags] = await Promise.all([
    listPublishedSnapshots({ sort, tag, viewerUserId }),
    listForestTags(),
  ]);

  return (
    <ForestFeedClient
      initialPublications={publications}
      initialTags={tags}
      initialSort={sort}
      initialTag={tag}
    />
  );
}
