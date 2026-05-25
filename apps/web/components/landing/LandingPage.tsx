"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useInView, useScrollY } from "@/lib/landing/landingHooks";
import {
  AppWindowMockup,
  CanvasMockup,
  DatabaseMockup,
} from "@/components/landing/LandingMockups";
import {
  LANDING_STYLES,
  LandingNav,
  HowItWorksSection,
  FeaturesGridSection,
  RolesSection,
  FeaturesMarqueeSection,
  FaqSection,
  CtaSection,
  LandingFooter,
} from "@/components/landing/LandingSections";

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

        <LandingNav />

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

        <HowItWorksSection howRef={howRef} howIn={howIn} />

        <FeaturesGridSection />

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

        <RolesSection rolesRef={rolesRef} rolesIn={rolesIn} />

        <FeaturesMarqueeSection />

        <FaqSection faqRef={faqRef} faqIn={faqIn} />

        <CtaSection ctaRef={ctaRef} ctaIn={ctaIn} />

        <LandingFooter />
      </div>
    </>
  );
}
