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
import { FeatureCard, RoleCard, FAQItem } from "@/components/landing/LandingCards";

export const LANDING_STYLES = `
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

export const FEATURE_TAGS = [
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

export function LandingNav() {
  return (
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
  );
}

interface HowItWorksSectionProps {
  howRef: React.Ref<HTMLDivElement>;
  howIn: boolean;
}

export function HowItWorksSection({ howRef, howIn }: HowItWorksSectionProps) {
  const steps = [
    { num: "01", title: "빠른 프로토타이핑", desc: "아이디어를 몇 분 안에 클릭 가능한 프로토타입과 실용적인 도구로 전환하세요. 워크플로우에 맞는 프로덕션 앱으로 출시하세요.", icon: <Zap size={20} /> },
    { num: "02", title: "함께 만들기", desc: "프로덕트 팀이 프로토타입을 만드는 동안 엔지니어는 기준을 유지합니다. 커서가 보이는 실시간 협업과 즉각적인 동기화.", icon: <Users size={20} /> },
    { num: "03", title: "실제 도구 출시", desc: "인증, 실시간 동기화, 유연한 뷰가 포함된 올인원 플랫폼. 프로토타입에서 프로덕션까지 며칠이면 충분합니다.", icon: <Zap size={20} /> },
  ];

  return (
    <section style={{ background: "#FFFFFF" }}>
      <div ref={howRef} className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className={`pt-32 pb-24 text-center reveal${howIn ? " in" : ""}`}>
          <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>이용 방법</p>
          <h2 className="font-bold" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>
            병목 없이 함께 만들어요
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 pb-32">
          {steps.map((step, i) => (
            <div key={step.num} className={`reveal${howIn ? " in" : ""}`} style={{ transitionDelay: `${i * 0.15}s` }}>
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
  );
}

export function FeaturesGridSection() {
  return (
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
  );
}

interface RolesSectionProps {
  rolesRef: React.Ref<HTMLDivElement>;
  rolesIn: boolean;
}

export function RolesSection({ rolesRef, rolesIn }: RolesSectionProps) {
  return (
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
  );
}

export function FeaturesMarqueeSection() {
  return (
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
  );
}

interface FaqSectionProps {
  faqRef: React.Ref<HTMLDivElement>;
  faqIn: boolean;
}

export function FaqSection({ faqRef, faqIn }: FaqSectionProps) {
  return (
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
  );
}

interface CtaSectionProps {
  ctaRef: React.Ref<HTMLDivElement>;
  ctaIn: boolean;
}

export function CtaSection({ ctaRef, ctaIn }: CtaSectionProps) {
  return (
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
  );
}

export function LandingFooter() {
  return (
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
  );
}
