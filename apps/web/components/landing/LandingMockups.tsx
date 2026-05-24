"use client";

import { FileText, Database, Layers } from "lucide-react";

export function AppWindowMockup() {
  return (
    <div
      className="w-full rounded-2xl"
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#FFFFFF",
        fontFamily: "var(--font-sans)",
        boxShadow:
          "0 0 0 1px rgba(46,125,69,0.12), 0 32px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
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
          obnofi — Q2 스프린트 계획
        </div>
        <div className="flex items-center gap-1.5">
          {[
            ["Y", "#2E7D45"],
            ["J", "#337EA9"],
            ["S", "#9065B0"],
          ].map(([l, c]) => (
            <div
              key={l}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: c, border: "2px solid #F7F7F5" }}
            >
              {l}
            </div>
          ))}
          <span className="text-xs ml-1" style={{ color: "#2E7D45" }}>
            3명 온라인
          </span>
        </div>
      </div>
      <div className="flex">
        <div
          className="w-52 flex-shrink-0 px-3 py-4"
          style={{ background: "#F7F7F5", borderRight: "1px solid #E3E2E0" }}
        >
          <div
            className="text-xs font-semibold px-2 mb-3"
            style={{ color: "#787774", letterSpacing: "0.06em" }}
          >
            워크스페이스
          </div>
          {[
            { icon: <FileText size={13} />, label: "Q2 스프린트 계획", active: true },
            { icon: <Database size={13} />, label: "태스크 트래커" },
            { icon: <Layers size={13} />, label: "디자인 보드" },
            { icon: <FileText size={13} />, label: "팀 OKR" },
            { icon: <FileText size={13} />, label: "릴리즈 노트" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-xs mb-0.5"
              style={{
                background: item.active ? "#EBEBEA" : "transparent",
                color: item.active ? "#37352F" : "#787774",
                fontWeight: item.active ? 500 : 400,
              }}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 px-10 py-8" style={{ background: "#FFFFFF" }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl select-none">🌿</span>
            <h2
              className="text-3xl font-bold"
              style={{ color: "#37352F", letterSpacing: "-0.02em" }}
            >
              Q2 스프린트 계획
            </h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-base font-semibold" style={{ color: "#37352F" }}>
              목표
            </div>
            {["5월 말까지 퍼블릭 베타 출시", "첫 500명 사용자 온보딩", "Clearing 캔버스 v2 출시"].map(
              (l) => (
                <div key={l} className="flex items-start gap-2">
                  <span style={{ color: "#787774" }}>•</span>
                  <span style={{ color: "#37352F" }}>{l}</span>
                </div>
              )
            )}
            <div className="pt-3 text-base font-semibold" style={{ color: "#37352F" }}>
              태스크 트래커
            </div>
            <div className="rounded-lg" style={{ border: "1px solid #E3E2E0", overflow: "hidden" }}>
              <div
                className="grid text-xs font-medium px-3 py-1.5"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr",
                  background: "#F7F7F5",
                  color: "#787774",
                  borderBottom: "1px solid #E3E2E0",
                }}
              >
                <span>태스크</span>
                <span>상태</span>
                <span>담당자</span>
              </div>
              {[
                { t: "디자인 시스템 감사", s: "완료",    o: "Yui", sb: "#E8F5EC", sc: "#2E7D45" },
                { t: "API 통합",          s: "진행 중", o: "Jin", sb: "#FAEBDD", sc: "#D9730D" },
                { t: "사용자 인터뷰",      s: "예정",   o: "Soo", sb: "#EBEBEA", sc: "#787774" },
              ].map((r) => (
                <div
                  key={r.t}
                  className="grid text-xs px-3 py-1.5"
                  style={{ gridTemplateColumns: "2fr 1fr 1fr", borderTop: "1px solid #E3E2E0" }}
                >
                  <span style={{ color: "#37352F" }}>{r.t}</span>
                  <span>
                    <span className="px-1.5 py-0.5 rounded" style={{ background: r.sb, color: r.sc }}>
                      {r.s}
                    </span>
                  </span>
                  <span style={{ color: "#787774" }}>{r.o}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pt-2">
              <div
                className="w-0.5 h-4 rounded"
                style={{ background: "#337EA9", animation: "cursor-blink 1.2s ease-in-out infinite" }}
              />
              <span className="text-xs px-1.5 py-0.5 rounded text-white" style={{ background: "#337EA9" }}>
                Jin이 입력 중…
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export function DatabaseMockup() {
  const rows = [
    { t: "디자인 시스템 감사", s: "완료",    d: "4/2",  o: "Yui" },
    { t: "API 통합",          s: "진행 중", d: "4/8",  o: "Jin" },
    { t: "사용자 테스트 계획", s: "예정",    d: "4/12", o: "Soo" },
    { t: "마케팅 랜딩",        s: "진행 중", d: "4/15", o: "Yui" },
    { t: "베타 초대 플로우",   s: "예정",    d: "4/20", o: "Jin" },
  ];
  const sc: Record<string, string> = {
    완료: "#E8F5EC",
    "진행 중": "#FAEBDD",
    예정: "#EBEBEA",
  };
  const tc: Record<string, string> = {
    완료: "#2E7D45",
    "진행 중": "#D9730D",
    예정: "#787774",
  };
  return (
    <div
      className="w-full rounded-2xl"
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#FFFFFF",
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
          태스크 트래커 — 테이블 뷰
        </div>
      </div>
      <div className="flex gap-0 px-4 pt-2" style={{ borderBottom: "1px solid #E3E2E0" }}>
        {["테이블", "보드", "갤러리", "캘린더", "타임라인"].map((v, i) => (
          <div
            key={v}
            className="text-xs px-3 py-2"
            style={{
              color: i === 0 ? "#37352F" : "#787774",
              fontWeight: i === 0 ? 500 : 400,
              borderBottom: i === 0 ? "2px solid #2E7D45" : "2px solid transparent",
            }}
          >
            {v}
          </div>
        ))}
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: "#F7F7F5" }}>
            {["태스크", "상태", "마감", "담당자"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-2.5 font-medium"
                style={{ color: "#787774" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const bg = sc[r.s] || "#EBEBEA";
            const textColor = tc[r.s] || "#787774";
            return (
              <tr key={r.t} style={{ borderTop: "1px solid #E3E2E0" }}>
                <td className="px-4 py-2.5" style={{ color: "#37352F" }}>
                  {r.t}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{ background: bg, color: textColor }}
                  >
                    {r.s}
                  </span>
                </td>
                <td className="px-4 py-2.5" style={{ color: "#787774" }}>
                  {r.d}
                </td>
                <td className="px-4 py-2.5" style={{ color: "#787774" }}>
                  {r.o}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
