"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Database,
  Layers,
  Check,
  Users,
  Zap,
  Lock,
  LayoutGrid,
  PenTool,
  Code,
} from "lucide-react";
import { SiteLogo } from "@/components/branding/SiteLogo";
import { useInView, useScrollY } from "@/lib/landing/landingHooks";
import {
  AppWindowMockup,
  CanvasMockup,
  DatabaseMockup,
} from "@/components/landing/LandingMockups";
import { FeatureCard, RoleCard, FAQItem } from "@/components/landing/LandingCards";

const LANDING_STYLES = `
  @keyframes orb-1 {
    0%,100% { transform: translate(0px,   0px)  scale(1);    }
    33%      { transform: translate(45px, -35px) scale(1.1);  }
    66%      { transform: translate(-25px, 45px) scale(0.92); }
  }
  @keyframes orb-2 {
    0%,100% { transform: translate(0px,   0px)   scale(1);   }
    40%      { transform: translate(-40px, 30px)  scale(1.08); }
    80%      { transform: translate(30px, -40px)  scale(0.95); }
  }
  @keyframes orb-3 {
    0%,100% { transform: translate(0px,  0px)  scale(1);   }
    50%      { transform: translate(25px, 35px) scale(1.12); }
  }
  @keyframes orb-4 {
    0%,100% { transform: translate(0px,   0px)  scale(1);   }
    60%      { transform: translate(-20px,-30px) scale(1.06); }
  }
  @keyframes float-mockup {
    0%,100% { transform: translateY(0px);   }
    50%      { transform: translateY(-18px); }
  }
  @keyframes shimmer-text {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes cursor-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  @keyframes sticky-float-1 {
    0%,100% { transform: translateY(0px)   rotate(-2deg); }
    50%      { transform: translateY(-8px)  rotate(-1deg); }
  }
  @keyframes sticky-float-2 {
    0%,100% { transform: translateY(0px)  rotate(1.5deg); }
    50%      { transform: translateY(-6px) rotate(2.5deg); }
  }
  @keyframes sticky-float-3 {
    0%,100% { transform: translateY(0px)   rotate(-1deg); }
    50%      { transform: translateY(-10px) rotate(0deg);  }
  }
  @keyframes marquee-left {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .reveal {
    opacity: 0;
    transform: translateY(40px);
    filter: blur(4px);
    transition: opacity 0.8s ease, transform 0.8s ease, filter 0.8s ease;
  }
  .reveal.in {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.22s; }
  .reveal-delay-3 { transition-delay: 0.36s; }
  .reveal-delay-4 { transition-delay: 0.52s; }
`;

const FEATURE_TAGS = [
  "블록 기반 편집",
  "슬래시 커맨드",
  "실시간 협업",
  "AI 보조 작성",
  "음성 입력 (Parrot)",
  "무한 캔버스",
  "6가지 DB 뷰",
  "그래프 뷰",
  "공개 링크 공유",
  "다크 / 라이트 / 정글 테마",
  "위키 링크",
  "URL 가져오기",
];

export function LandingPage() {
  const scrollY = useScrollY();

  const { ref: heroRef,  inView: heroIn  } = useInView(0.01);
  const { ref: howRef,   inView: howIn   } = useInView(0.05);
  const { ref: s1Ref,    inView: s1In    } = useInView(0.1);
  const { ref: s2Ref,    inView: s2In    } = useInView(0.1);
  const { ref: ctaRef,   inView: ctaIn   } = useInView(0.1);
  const { ref: rolesRef, inView: rolesIn } = useInView(0.1);
  const { ref: faqRef,   inView: faqIn   } = useInView(0.1);

  return (
    <>
      <style>{LANDING_STYLES}</style>

      <div style={{ fontFamily: "var(--font-sans)" }}>

        {/* ══ NAV ═══════════════════════════════════════════════════ */}
        <nav
          className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <SiteLogo className="h-auto w-[96px]" />
          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="text-sm px-4 py-2 rounded-lg hidden sm:block" style={{ color: "rgba(55,53,47,0.5)" }}>
              로그인
            </Link>
            <Link href="/auth/signin" className="text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: "#2E7D45" }}>
              무료로 시작하기
            </Link>
          </div>
        </nav>

        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <section
          className="relative flex flex-col items-center justify-center text-center px-6"
          style={{ background: "#FFFFFF", minHeight: "100vh", paddingTop: "120px", paddingBottom: "120px" }}
        >
          {/* parallax orbs */}
          <div className="absolute inset-0 pointer-events-none" style={{ overflow: "hidden" }} aria-hidden>
            <div style={{ position:"absolute", top:"-20%", left:"-8%", width:"60%", height:"75%", background:"radial-gradient(circle, rgba(46,125,69,0.13) 0%, transparent 70%)", filter:"blur(72px)", animation:"orb-1 14s ease-in-out infinite", transform:`translateY(${scrollY * 0.15}px)` }} />
            <div style={{ position:"absolute", top:"5%", right:"-12%", width:"50%", height:"65%", background:"radial-gradient(circle, rgba(61,160,90,0.09) 0%, transparent 70%)", filter:"blur(80px)", animation:"orb-2 18s ease-in-out infinite", transform:`translateY(${scrollY * 0.08}px)` }} />
            <div style={{ position:"absolute", bottom:"-8%", left:"22%", width:"55%", height:"60%", background:"radial-gradient(circle, rgba(46,125,69,0.1) 0%, transparent 70%)", filter:"blur(64px)", animation:"orb-3 11s ease-in-out infinite", transform:`translateY(${scrollY * -0.1}px)` }} />
            <div style={{ position:"absolute", top:"25%", right:"18%", width:"32%", height:"45%", background:"radial-gradient(circle, rgba(51,126,169,0.07) 0%, transparent 70%)", filter:"blur(80px)", animation:"orb-4 16s ease-in-out infinite" }} />
          </div>

          <div ref={heroRef} className="relative z-10" style={{ maxWidth: "72ch" }}>
            <p className={`text-sm mb-6 reveal${heroIn ? " in" : ""}`} style={{ color: "#2E7D45", letterSpacing: "0.14em", fontWeight: 600 }}>
              더 빠르게 출시하세요
            </p>
            <h1 className={`font-bold mb-6 leading-tight reveal reveal-delay-1${heroIn ? " in" : ""}`} style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>
              빠르게 프로토타입하고.<br />
              일찍 검증하고.<br />
              <span style={{ color: "#2E7D45" }}>기다리지 말고 출시하세요.</span>
            </h1>
            <p className={`text-lg mb-10 mx-auto reveal reveal-delay-2${heroIn ? " in" : ""}`} style={{ color: "rgba(55,53,47,0.6)", maxWidth: "48ch", lineHeight: 1.7 }}>
              Notion 스타일 편집기, FigJam 스타일 캔버스, Obsidian 스타일 그래프가 하나로.
              팀과 함께 아이디어를 구조화하고 실시간으로 완성하세요.
            </p>
            <div className={`flex items-center justify-center gap-3 reveal reveal-delay-3${heroIn ? " in" : ""}`}>
              <Link href="/auth/signin" className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-white" style={{ background: "#2E7D45", fontSize: "15px" }}>
                무료로 시작하기 <ArrowRight size={16} />
              </Link>
              <Link href="/auth/signin" className="px-7 py-3.5 rounded-xl" style={{ color: "rgba(55,53,47,0.5)", background: "rgba(0,0,0,0.05)", fontSize: "15px" }}>
                로그인
              </Link>
            </div>
          </div>
        </section>

        {/* ══ MOCKUP ════════════════════════════════════════════════ */}
        <section style={{ background: "#F7F7F5", padding: "120px 24px 160px" }}>
          <div className="max-w-6xl mx-auto" style={{ animation: "float-mockup 8s ease-in-out infinite" }}>
            <AppWindowMockup />
          </div>
        </section>

        {/* ══ HOW IT WORKS — 3 Steps ════════════════════════════════ */}
        <section style={{ background: "#FFFFFF" }}>
          <div ref={howRef} className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className={`pt-32 pb-24 text-center reveal${howIn ? " in" : ""}`}>
              <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>이용 방법</p>
              <h2 className="font-bold" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>
                병목 없이 함께 만들어요
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 pb-32">
              {[
                { num: "01", title: "빠른 프로토타이핑", desc: "아이디어를 몇 분 안에 클릭 가능한 프로토타입과 실용적인 도구로 전환하세요. 워크플로우에 맞는 프로덕션 앱으로 출시하세요.", icon: <Zap size={20} /> },
                { num: "02", title: "함께 만들기", desc: "프로덕트 팀이 프로토타입을 만드는 동안 엔지니어는 기준을 유지합니다. 커서가 보이는 실시간 협업과 즉각적인 동기화.", icon: <Users size={20} /> },
                { num: "03", title: "실제 도구 출시", desc: "인증, 실시간 동기화, 유연한 뷰가 포함된 올인원 플랫폼. 프로토타입에서 프로덕션까지 며칠이면 충분합니다.", icon: <Zap size={20} /> },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`reveal${howIn ? " in" : ""}`}
                  style={{ transitionDelay: `${i * 0.15}s` }}
                >
                  <div className="mb-4">
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: "#E8F5EC", color: "#2E7D45" }}>{step.num}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#E8F5EC", color: "#2E7D45" }}>
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3" style={{ color: "#1A1A1A" }}>{step.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: "#787774" }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES GRID ═════════════════════════════════════════ */}
        <section style={{ background: "#F7F7F5", padding: "140px 0" }}>
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>기능</p>
              <h2 className="font-bold" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>필요한 모든 것</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard icon={<FileText size={20} />} title="블록 기반 편집기" description="슬래시 커맨드, 드래그 앤 드롭 블록, 풍부한 서식. 마법 같은 문서 작성 경험." />
              <FeatureCard icon={<LayoutGrid size={20} />} title="유연한 데이터베이스" description="테이블, 보드, 갤러리, 캘린더, 타임라인 뷰. 데이터를 필터, 정렬, 그룹화하세요." />
              <FeatureCard icon={<Layers size={20} />} title="무한 캔버스" description="브레인스토밍을 위한 FigJam 스타일 화이트보드. 스티키 노트, 커넥터, 실시간 커서." />
              <FeatureCard icon={<Database size={20} />} title="그래프 뷰" description="Obsidian 스타일 지식 그래프. 페이지 간 연결을 시각화하세요." />
              <FeatureCard icon={<Zap size={20} />} title="실시간 협업" description="Yjs 기반 동기화. 팀원의 커서를 보고, 편집이 즉시 반영됩니다." />
              <FeatureCard icon={<Lock size={20} />} title="공개 공유" description="커스텀 링크로 페이지 공유. 보기, 댓글, 편집 권한을 제어하세요." />
            </div>
          </div>
        </section>

        {/* ══ CANVAS ════════════════════════════════════════════════ */}
        <section style={{ background: "linear-gradient(160deg, #E8F5EC 0%, #F0FAF3 60%, #E4F4EC 100%)", minHeight: "90vh", display: "flex", alignItems: "center" }}>
          <div
            ref={s1Ref}
            className={`max-w-6xl mx-auto px-6 lg:px-12 py-32 grid items-center gap-16 w-full reveal${s1In ? " in" : ""} lg:grid-cols-2`}
          >
            <div>
              <p className="text-xs font-semibold mb-5" style={{ color: "#2E7D45", letterSpacing: "0.14em" }}>클리어링 캔버스</p>
              <h2 className="font-bold mb-6 leading-tight" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#1F3D2A" }}>
                아이디어를 펼치는<br />무한 캔버스
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "#3D6B50", maxWidth: "36ch" }}>
                스티키 노트, 도형, 커넥터, 이미지를 자유롭게 배치하세요.
                팀원이 실시간으로 어디에 있는지 커서로 확인됩니다.
              </p>
              <ul className="space-y-3">
                {["무한 확장 가능한 캔버스", "실시간 커서 동기화", "스티키 노트와 도형", "페이지와 연결"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#3D6B50" }}>
                    <Check size={14} style={{ color: "#2E7D45" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <CanvasMockup />
          </div>
        </section>

        {/* ══ DATABASE ══════════════════════════════════════════════ */}
        <section style={{ background: "#FFFFFF", minHeight: "90vh", display: "flex", alignItems: "center" }}>
          <div
            ref={s2Ref}
            className={`max-w-6xl mx-auto px-6 lg:px-12 py-32 grid items-center gap-16 w-full reveal${s2In ? " in" : ""} lg:grid-cols-2`}
          >
            <DatabaseMockup />
            <div>
              <p className="text-xs font-semibold mb-5" style={{ color: "#2E7D45", letterSpacing: "0.14em" }}>언더그로스 데이터베이스</p>
              <h2 className="font-bold mb-6 leading-tight" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#37352F" }}>
                데이터를<br />원하는 방식으로
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "#787774", maxWidth: "36ch" }}>
                테이블, 보드, 갤러리, 캘린더, 타임라인 — 같은 데이터를
                5가지 뷰로 자유롭게 전환. 필터와 정렬로 인사이트를 꺼내세요.
              </p>
              <ul className="space-y-3">
                {["5가지 뷰 전환", "필터와 정렬", "관계형 데이터베이스", "속성 타입 10+ 종류"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#787774" }}>
                    <Check size={14} style={{ color: "#2E7D45" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ══ ROLES ═════════════════════════════════════════════════ */}
        <section style={{ background: "#F7F7F5", padding: "140px 0" }}>
          <div ref={rolesRef} className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-16 reveal${rolesIn ? " in" : ""}`}>
              <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>모든 역할을 위해</p>
              <h2 className="font-bold" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>
                팀의 가능성을 끌어내세요
              </h2>
            </div>
            <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 reveal${rolesIn ? " in" : ""}`}>
              <RoleCard icon={<LayoutGrid size={18} />} title="PM을 위해" features={["몇 분 안에 인터랙티브 프로토타입", "실제 데이터로 신뢰할 수 있는 데모", "핸드오프를 위한 GitHub 동기화", "워크플로우 도구 통합"]} />
              <RoleCard icon={<PenTool size={18} />} title="디자이너를 위해" features={["창의적 제어를 위한 디자인 모드", "일관된 워크스페이스 테마", "프로덕션 준비 구조", "정적인 목업 그 이상"]} />
              <RoleCard icon={<Code size={18} />} title="개발자를 위해" features={["프로토타입을 통한 명확한 요구사항", "엣지 케이스를 일찍 발견", "표준 기술 스택", "PR 리뷰를 위한 GitHub 동기화"]} />
              <RoleCard icon={<Users size={18} />} title="마케터를 위해" features={["빠르게 랜딩 페이지 출시", "일관성을 위한 공유 테마", "폼을 도구에 연결", "개발 없이 실험"]} />
            </div>
          </div>
        </section>

        {/* ══ FEATURES MARQUEE ══════════════════════════════════════ */}
        <section style={{ background: "#2E7D45", overflow: "hidden", padding: "100px 0" }}>
          <p className="text-xs font-semibold text-center mb-10" style={{ color: "rgba(255,252,237,0.5)", letterSpacing: "0.14em" }}>기능</p>
          <div style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
            <div className="flex gap-5 flex-shrink-0" style={{ animation: "marquee-left 36s linear infinite" }}>
              {[...FEATURE_TAGS, ...FEATURE_TAGS].map((tag, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-7 py-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,252,237,0.16)", color: "#FFFCED", fontSize: "16px", fontWeight: 500, whiteSpace: "nowrap" }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ═══════════════════════════════════════════════════ */}
        <section style={{ background: "#FFFFFF", padding: "140px 0" }}>
          <div ref={faqRef} className="max-w-3xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-16 reveal${faqIn ? " in" : ""}`}>
              <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>FAQ</p>
              <h2 className="font-bold" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>자주 묻는 질문</h2>
            </div>
            <div className={`reveal${faqIn ? " in" : ""}`}>
              <FAQItem question="데이터 소유권은 어떻게 되나요?" answer="데이터는 완전히 당신의 것입니다. 페이지와 데이터베이스를 언제든지 내보낼 수 있습니다. 종속 없이 콘텐츠에 항상 접근하고 이동할 수 있습니다." />
              <FAQItem question="어떤 보안 조치가 있나요?" answer="Obnofi는 저장 및 전송 중 데이터에 업계 표준 암호화를 적용합니다. 역할 기반 접근 제어, 감사 로그, 정기 보안 검토를 지원합니다." />
              <FAQItem question="Obnofi는 Notion과 어떻게 다른가요?" answer="Notion이 문서와 데이터베이스에 집중하는 반면, Obnofi는 FigJam 스타일 캔버스와 Obsidian 스타일 그래프 뷰를 하나의 원활한 경험으로 통합합니다 — Yjs 기반 실시간 협업도 포함됩니다." />
              <FAQItem question="팀은 어떤 지원을 받을 수 있나요?" answer="모든 사용자는 문서와 커뮤니티 지원을 받을 수 있습니다. 팀 플랜에는 빠른 응답 시간과 전담 온보딩 지원이 포함된 우선 지원이 제공됩니다." />
            </div>
          </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════════ */}
        <section className="relative" style={{ background: "#F7F7F5", overflow: "hidden", minHeight: "80vh", display: "flex", alignItems: "center" }}>
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(46,125,69,0.07) 0%, transparent 70%)" }} />
          <div
            ref={ctaRef}
            className={`relative z-10 max-w-2xl mx-auto px-6 lg:px-12 py-32 text-center w-full reveal${ctaIn ? " in" : ""}`}
          >
            <h2 className="font-bold mb-5" style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>
              지금 시작하세요
            </h2>
            <p className="text-lg mb-10" style={{ color: "rgba(55,53,47,0.5)" }}>가입 즉시 무료. 카드 번호 없음.</p>
            <Link href="/auth/signin" className="inline-flex items-center gap-2 font-semibold px-9 py-4 rounded-xl text-white" style={{ background: "#2E7D45", fontSize: "16px" }}>
              무료로 시작하기 <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════ */}
        <footer className="px-6 lg:px-12 py-10" style={{ background: "#FFFFFF", borderTop: "1px solid #E3E2E0" }}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <SiteLogo className="h-auto w-[90px]" />
            <div className="flex items-center gap-6">
              <Link href="/auth/signin" className="text-sm" style={{ color: "#787774" }}>개인정보처리방침</Link>
              <Link href="/auth/signin" className="text-sm" style={{ color: "#787774" }}>이용약관</Link>
              <Link href="/auth/signin" className="text-sm" style={{ color: "#787774" }}>문의하기</Link>
            </div>
            <p className="text-sm" style={{ color: "#787774" }}>© 2025 Obnofi</p>
          </div>
        </footer>
      </div>
    </>
  );
}
