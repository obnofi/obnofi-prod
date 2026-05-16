"use client";

import { useCallback, useEffect, useRef, useState, type WheelEvent } from "react";

interface InlineBlockShellProps {
  children: React.ReactNode;
  /** 활성화 힌트 텍스트 (기본: "더블클릭하여 상호작용") */
  activationHint?: string;
  /** 활성화 상태 테두리 색상 클래스 (기본: border-[#2E7D45]) */
  activeBorderClass?: string;
  /** 비활성 상태에서 추가할 className */
  className?: string;
}

/**
 * 인라인 블록(canvas, database, db-diagram)을 감싸는 공통 셸.
 *
 * - 비활성 상태: 오버레이가 포인터 이벤트를 차단 → 페이지 스크롤 통과
 * - 더블클릭: 활성화 → 내부 인터랙션(스크롤·편집) 가능
 * - 활성 상태에서 외부 클릭 또는 Escape: 비활성화
 */
export function InlineBlockShell({
  children,
  activationHint = "더블클릭하여 상호작용",
  activeBorderClass = "border-[#2E7D45]",
  className = "",
}: InlineBlockShellProps) {
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setIsHovered(false);
  }, []);

  /**
   * 비활성 오버레이 위에서 휠 이벤트가 발생하면 가장 가까운 scrollable 조상에
   * 스크롤을 위임한다. 이를 통해 canvas/database 블록 위에서도 페이지 스크롤이
   * 정상적으로 동작한다.
   */
  const handleOverlayWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    // 내부 콘텐츠로 전파되지 않게 막는다
    e.stopPropagation();

    let el: HTMLElement | null = shellRef.current?.parentElement ?? null;
    while (el) {
      const { overflowY } = window.getComputedStyle(el);
      if (overflowY === "auto" || overflowY === "scroll") {
        el.scrollBy({ top: e.deltaY, left: e.deltaX, behavior: "instant" as ScrollBehavior });
        break;
      }
      el = el.parentElement;
    }
  }, []);

  // 외부 클릭 시 비활성화
  useEffect(() => {
    if (!isActive) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        deactivate();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        deactivate();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, deactivate]);

  return (
    <div
      ref={shellRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 내부 콘텐츠 */}
      <div
        className={`relative rounded-xl border-2 transition-all duration-150 ${
          isActive
            ? `${activeBorderClass} shadow-[0_0_0_3px_rgba(46,125,69,0.12)]`
            : "border-transparent"
        }`}
      >
        {children}

        {/* 비활성 오버레이 — 포인터 이벤트 차단 + 더블클릭 감지 */}
        {!isActive && (
          <div
            className="absolute inset-0 z-10 cursor-default rounded-xl"
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              activate();
            }}
            // 단일 클릭은 그냥 흘려보내되 포커스는 막음
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            // 휠 이벤트는 부모 스크롤 컨테이너로 위임 — 페이지 스크롤 정상화
            onWheel={handleOverlayWheel}
          >
            {/* 호버 힌트 */}
            {isHovered && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03]">
                <span className="rounded-md bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm dark:bg-white/70 dark:text-black">
                  {activationHint}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 활성 상태 — 종료 배지 */}
        {isActive && (
          <div className="pointer-events-none absolute right-2 top-2 z-20">
            <span className="rounded-md bg-[#2E7D45]/90 px-2 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm">
              Esc 로 나가기
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
