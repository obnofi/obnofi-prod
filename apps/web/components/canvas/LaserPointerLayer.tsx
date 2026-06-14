"use client";

// Firefly — 레이저 포인터 렌더. 좌표는 client(뷰포트) 좌표계.
// position:fixed 전체 화면 SVG에 그려 문서/캔버스 등 모든 페이지 위에 표시된다.

export type RenderableLaser = {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  fadingOut?: boolean;
};

export function LaserPointerLayer({ lasers }: { lasers: RenderableLaser[] }) {
  if (lasers.length === 0) return null;

  return (
    <svg className="pointer-events-none fixed inset-0 z-[10050] h-screen w-screen overflow-visible">
      {lasers.map((laser, index) => {
        const pts = laser.points;
        if (pts.length === 0) return null;
        const head = pts[pts.length - 1];
        const blurId = `laser-glow-${index}`;
        const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

        return (
          <g
            key={laser.id}
            style={{
              opacity: laser.fadingOut ? 0 : 1,
              transition: "opacity 300ms ease-out",
            }}
          >
            <defs>
              <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            {pts.length > 1 ? (
              <polyline
                points={polyline}
                fill="none"
                stroke={laser.color}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.4}
                filter={`url(#${blurId})`}
              />
            ) : null}

            {/* glow halo */}
            <circle cx={head.x} cy={head.y} r={11} fill={laser.color} opacity={0.45} filter={`url(#${blurId})`} />
            {/* core dot */}
            <circle cx={head.x} cy={head.y} r={5} fill={laser.color} />
            <circle cx={head.x} cy={head.y} r={2} fill="#ffffff" opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
}
