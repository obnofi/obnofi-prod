import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";

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
              const applyTheme = (isDark) => {
                root.classList.toggle("dark", isDark);
                root.style.colorScheme = isDark ? "dark" : "light";
              };
              applyTheme(media.matches);
              const onChange = (event) => applyTheme(event.matches);
              if (typeof media.addEventListener === "function") {
                media.addEventListener("change", onChange);
              } else if (typeof media.addListener === "function") {
                media.addListener(onChange);
              }
            })();
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
