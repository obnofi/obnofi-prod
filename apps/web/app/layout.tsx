import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { JungleCursorSync } from "@/components/cursor/JungleCursorSync";
import { JungleCornerDecorations } from "@/components/JungleCornerDecorations";

export const metadata: Metadata = {
  title: "Obnofi",
  description: "A Notion-like workspace with publishing",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              const root = document.documentElement;
              const media = window.matchMedia("(prefers-color-scheme: dark)");
              const storedTheme = window.localStorage.getItem("obnofi-theme");
              const applyTheme = (theme) => {
                root.classList.remove("dark", "jungle");
                if (theme === "dark") {
                  root.classList.add("dark");
                  root.style.colorScheme = "dark";
                  return;
                }
                if (theme === "jungle") {
                  root.classList.add("jungle");
                  root.style.colorScheme = "light";
                  return;
                }
                root.style.colorScheme = "light";
              };

              if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "jungle") {
                applyTheme(storedTheme);
              } else {
                applyTheme(media.matches ? "dark" : "light");
              }
            })();
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <JungleCursorSync />
          <JungleCornerDecorations />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
