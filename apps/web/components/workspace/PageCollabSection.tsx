"use client";

import { Users, AlignLeft, Copy, Check, UserPlus, ChevronRight, X } from "lucide-react";
import type { PageCollaborator, PageType } from "@obnofi/types";

interface PageCollabSectionProps {
  pageType: PageType;
  collaborationEnabled: boolean;
  lineIndicatorEnabled: boolean;
  activeCollaboratorCount: number;
  collaborators: PageCollaborator[];
  collabCopied: boolean;
  isCollabOpen: boolean;
  collabInviteEmail: string;
  collabInviteLoading: boolean;
  onCollaborationEnabledChange: (enabled: boolean) => void;
  onLineIndicatorEnabledChange: (enabled: boolean) => void;
  onCopyCollabLink: () => void;
  onToggleCollabOpen: () => void;
  onCollabInviteEmailChange: (email: string) => void;
  onInviteCollaborator: (e: React.FormEvent) => void;
  onRemoveCollaborator: (userId: string) => void;
}

export function PageCollabSection({
  pageType,
  collaborationEnabled,
  lineIndicatorEnabled,
  activeCollaboratorCount,
  collaborators,
  collabCopied,
  isCollabOpen,
  collabInviteEmail,
  collabInviteLoading,
  onCollaborationEnabledChange,
  onLineIndicatorEnabledChange,
  onCopyCollabLink,
  onToggleCollabOpen,
  onCollabInviteEmailChange,
  onInviteCollaborator,
  onRemoveCollaborator,
}: PageCollabSectionProps) {
  return (
    <div className="px-1 py-1.5">
      <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
        공동 편집
      </p>

      {/* 공동 편집 켜기/끄기 */}
      <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <Users className="h-4 w-4 text-[var(--color-text-secondary)]" />
            {activeCollaboratorCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--color-accent)] ring-1 ring-[var(--color-surface)]" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              공동 편집
            </p>
            <p className="text-[11px] text-[var(--color-text-placeholder)]">
              {collaborationEnabled
                ? activeCollaboratorCount > 0
                  ? `${activeCollaboratorCount}명 편집 중`
                  : "커서 기반 공유 편집이 기본으로 활성화됨"
                : "비활성화됨"}
            </p>
          </div>
        </div>
        <button
          onClick={() => onCollaborationEnabledChange(!collaborationEnabled)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            collaborationEnabled
              ? "bg-[var(--color-accent)]"
              : "bg-zinc-300 dark:bg-zinc-600"
          }`}
          aria-label={collaborationEnabled ? "공동 편집 끄기" : "공동 편집 켜기"}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              collaborationEnabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* 공동 편집 활성 시 추가 옵션 */}
      {collaborationEnabled && (
        <>
          {/* 커서 기반 안내 + 라인 기반 토글 (문서 타입만) */}
          {pageType === "document" && (
            <>
              <div className="rounded-md px-2 py-2 text-[11px] text-[var(--color-text-placeholder)]">
                현재 모드: 커서 기반 공동 편집
              </div>
              <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]">
                <div className="flex items-center gap-2.5">
                  <AlignLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  <div>
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                      라인 기반 점유 표시
                    </p>
                    <p className="text-[11px] text-[var(--color-text-placeholder)]">
                      커서 표시와 함께 블록 왼쪽에 협업자 색상 바 추가
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onLineIndicatorEnabledChange(!lineIndicatorEnabled)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    lineIndicatorEnabled
                      ? "bg-[var(--color-accent)]"
                      : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                  aria-label={lineIndicatorEnabled ? "줄 점유 표시 끄기" : "줄 점유 표시 켜기"}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      lineIndicatorEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </>
          )}

          {/* 링크 복사 */}
          <button
            onClick={onCopyCollabLink}
            className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
          >
            <div className="flex items-center gap-2.5">
              <Copy className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                링크 복사
              </span>
            </div>
            {collabCopied ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" />
            )}
          </button>

          {/* 협업자 관리 */}
          <button
            type="button"
            onClick={onToggleCollabOpen}
            className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]"
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <div className="text-left">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  협업자 초대
                </p>
                <p className="text-[11px] text-[var(--color-text-placeholder)]">
                  {collaborators.length > 0
                    ? `${collaborators.length}명 초대됨`
                    : "초대된 협업자 없음"}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-3.5 w-3.5 text-[var(--color-text-placeholder)] transition-transform ${
                isCollabOpen ? "rotate-90" : ""
              }`}
            />
          </button>

          {isCollabOpen && (
            <div className="ml-2 mt-0.5 flex flex-col gap-1 border-l border-[var(--color-border)] pl-2">
              <form
                onSubmit={(e) => void onInviteCollaborator(e)}
                className="flex gap-1.5 px-1 py-1"
              >
                <input
                  type="email"
                  value={collabInviteEmail}
                  onChange={(e) => onCollabInviteEmailChange(e.target.value)}
                  placeholder="이메일 주소"
                  className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                />
                <button
                  type="submit"
                  disabled={collabInviteLoading || !collabInviteEmail.trim()}
                  className="rounded bg-[var(--color-accent)] px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                >
                  초대
                </button>
              </form>
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[var(--color-hover)]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {c.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.user.image} alt="" className="h-5 w-5 rounded-full" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[10px] text-[var(--color-accent)]">
                        {(c.user.name ?? c.user.email)[0].toUpperCase()}
                      </span>
                    )}
                    <span className="truncate text-[12px] text-[var(--color-text-primary)]">
                      {c.user.name ?? c.user.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onRemoveCollaborator(c.userId)}
                    className="ml-1 shrink-0 rounded p-0.5 transition hover:bg-[var(--color-hover)]"
                    aria-label="협업자 제거"
                  >
                    <X className="h-3 w-3 text-[var(--color-text-secondary)]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
