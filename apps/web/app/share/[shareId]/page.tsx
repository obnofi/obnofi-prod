import { notFound } from "next/navigation";
import { SharePageClient } from "./SharePageClient";

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

async function getPublicPage(shareId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/public/pages/${shareId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;
  const page = await getPublicPage(shareId);

  if (!page) {
    notFound();
  }

  return (
    <SharePageClient
      shareId={shareId}
      initialData={
        page.isPasswordProtected
          ? null
          : {
              id: page.id,
              title: page.title,
              content: page.content,
              updatedAt: page.updatedAt,
            }
      }
      isPasswordProtected={page.isPasswordProtected}
    />
  );
}
