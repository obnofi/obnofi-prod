export type PublishedSnapshotType = "page" | "canvas" | "graph";

export interface PublishedSnapshotAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface PublishedSnapshotSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
  likeCount: number;
  createdAt: string;
  snapshotType: PublishedSnapshotType;
  author: PublishedSnapshotAuthor;
  pageId: string | null;
  workspaceId: string | null;
  viewerHasLiked: boolean;
}

export interface PublishedPageSnapshotContent {
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: object | null;
  updatedAt: string;
  pageType: "document" | "canvas" | "database";
}

export interface PublishedGraphSnapshotContent {
  workspaceId: string;
  focusedPageId: string | null;
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
}

export interface PublishedSnapshotDetail extends PublishedSnapshotSummary {
  snapshotContent: PublishedPageSnapshotContent | PublishedGraphSnapshotContent;
}

export interface PublishedSnapshotManageResponse {
  publication: PublishedSnapshotSummary | null;
}
