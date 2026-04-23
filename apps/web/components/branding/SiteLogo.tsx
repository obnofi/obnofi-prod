interface SiteLogoProps {
  alt?: string;
  className?: string;
  height?: number;
  priority?: boolean;
  width?: number;
}

export function SiteLogo({
  alt = "Obnofi logo",
  className,
  height = 233,
  priority = false,
  width = 537,
}: SiteLogoProps) {
  return (
    <picture>
      <source
        media="(prefers-color-scheme: dark)"
        srcSet="/obnofidarkmodelogo.png"
      />
      <img
        src="/obnofilogosvg.svg"
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
