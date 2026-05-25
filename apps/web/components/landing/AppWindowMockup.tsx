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
