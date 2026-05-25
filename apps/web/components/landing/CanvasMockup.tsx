"use client";

export function CanvasMockup() {
  return (
    <div
      className="w-full rounded-2xl"
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#FCFBF7",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="flex items-center gap-1.5 px-4 py-3"
        style={{ background: "#F7F7F5", borderBottom: "1px solid #E3E2E0" }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F56" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#FFBD2E" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#27C93F" }} />
        <div
          className="mx-auto text-xs px-4 py-0.5 rounded"
          style={{ background: "#EBEBEA", color: "#787774" }}
        >
          디자인 보드 — 클리어링 캔버스
        </div>
      </div>
      <div className="relative" style={{ height: 420 }}>
        <svg className="absolute inset-0 w-full h-full" aria-hidden>
          <defs>
            <pattern id="c-dot" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(55,53,47,0.12)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#c-dot)" />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden
        >
          <line
            x1="195" y1="110" x2="340" y2="160"
            stroke="#DDDCDA" strokeWidth="1.5" strokeDasharray="5 3"
          />
          <line
            x1="195" y1="110" x2="100" y2="230"
            stroke="#DDDCDA" strokeWidth="1.5" strokeDasharray="5 3"
          />
        </svg>
        <div
          className="absolute"
          style={{ top: 32, left: 50, animation: "sticky-float-1 7s ease-in-out infinite" }}
        >
          <div
            className="text-xs px-4 py-3 rounded w-36"
            style={{ background: "#FFF1A8", color: "#3B3224", transform: "rotate(-2deg)" }}
          >
            <div className="font-semibold mb-1">사용자 리서치</div>
            <div style={{ color: "#6B5A3E" }}>12번의 인터뷰 페인 포인트</div>
          </div>
        </div>
        <div
          className="absolute"
          style={{ top: 28, right: 60, animation: "sticky-float-2 9s ease-in-out infinite" }}
        >
          <div
            className="text-xs px-4 py-3 rounded w-36"
            style={{ background: "#FFD9E6", color: "#3B1A1F", transform: "rotate(1.5deg)" }}
          >
            <div className="font-semibold mb-1">스프린트 목표</div>
            <div style={{ color: "#6B3347" }}>금요일까지 캔버스 v2 출시</div>
          </div>
        </div>
        <div
          className="absolute"
          style={{ top: 220, left: 32, animation: "sticky-float-3 8s ease-in-out infinite" }}
        >
          <div
            className="text-xs px-4 py-3 rounded w-40"
            style={{ background: "#DDF1FF", color: "#102942", transform: "rotate(-1deg)" }}
          >
            <div className="font-semibold mb-1">다음 단계</div>
            <div style={{ color: "#274A63" }}>Q3 디자인 토큰</div>
          </div>
        </div>
        <div className="absolute" style={{ top: 155, left: 210 }}>
          <div
            className="text-xs px-4 py-3 rounded-lg w-44"
            style={{ background: "#FFFFFF", border: "1px solid #E3E2E0", color: "#37352F" }}
          >
            <div className="font-semibold mb-1">Obnofi 로드맵</div>
            <div style={{ color: "#787774" }}>3명 협업 중</div>
          </div>
        </div>
        <div
          className="absolute"
          style={{ top: 300, right: 50, animation: "sticky-float-1 11s ease-in-out infinite reverse" }}
        >
          <div
            className="text-xs px-4 py-3 rounded w-32"
            style={{ background: "#DDE8CD", color: "#1F5230", transform: "rotate(0.8deg)" }}
          >
            <div className="font-semibold mb-1">아이디어</div>
            <div>캔버스용 Parrot</div>
          </div>
        </div>
      </div>
    </div>
  );
}
