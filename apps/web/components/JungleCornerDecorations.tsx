"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getResolvedTheme } from "@/lib/theme";

const CORNERS = [
  {
    src: "/background/bottom-right.png",
    alt: "jungle decoration bottom-right",
    className: "bottom-0 right-0",
    size: 110,
  },
] as const;

export function JungleCornerDecorations() {
  const [isJungle, setIsJungle] = useState(false);

  useEffect(() => {
    setIsJungle(getResolvedTheme() === "jungle");

    const observer = new MutationObserver(() => {
      setIsJungle(getResolvedTheme() === "jungle");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  if (!isJungle) return null;

  return (
    <>
      {CORNERS.map(({ src, alt, className, size }) => (
        <div
          key={src}
          className={`fixed ${className} pointer-events-none select-none`}
          style={{ zIndex: 35 }}
        >
          <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            className="object-contain"
            priority
          />
        </div>
      ))}
    </>
  );
}
