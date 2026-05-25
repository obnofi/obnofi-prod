"use client";

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
