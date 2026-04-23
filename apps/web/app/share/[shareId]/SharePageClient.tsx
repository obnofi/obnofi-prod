"use client";

import { useState, useEffect } from "react";
import { PublicPageView } from "@/components/share/PublicPageView";
import { PasswordPrompt } from "@/components/share/PasswordPrompt";

interface PageData {
  id: string;
  title: string;
  content: object | null;
  updatedAt: string;
}

interface SharePageClientProps {
  shareId: string;
  initialData: PageData | null;
  isPasswordProtected: boolean;
}

export function SharePageClient({
  shareId,
  initialData,
  isPasswordProtected: initialIsProtected,
}: SharePageClientProps) {
  const [pageData, setPageData] = useState<PageData | null>(initialData);
  const [isPasswordProtected, setIsPasswordProtected] = useState(
    initialIsProtected
  );

  useEffect(() => {
    const handlePasswordSuccess = (e: Event) => {
      const data = (e as CustomEvent).detail as PageData;
      setPageData(data);
      setIsPasswordProtected(false);
    };
    window.addEventListener("password-success", handlePasswordSuccess);
    return () => window.removeEventListener("password-success", handlePasswordSuccess);
  }, []);

  if (isPasswordProtected) {
    return <PasswordPrompt shareId={shareId} onSuccessAction="password-success" />;
  }

  if (!pageData) {
    return null;
  }

  return (
    <PublicPageView
      title={pageData.title}
      content={pageData.content}
      updatedAt={pageData.updatedAt}
    />
  );
}
