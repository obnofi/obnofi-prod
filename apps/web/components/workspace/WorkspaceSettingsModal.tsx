"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Bell,
  ExternalLink,
  Globe,
  KeyRound,
  Link2,
  Mail,
  Moon,
  Shield,
  Sun,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { profileImagePresets } from "@/lib/profileImagePresets";
import { applyTheme, getResolvedTheme, type ObnofiTheme } from "@/lib/theme";

type SettingsTab = "account" | "workspace";

type ProfileResponse = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  preferences?: Record<string, unknown>;
  connectedAccounts?: string[];
};

type WorkspaceSettingsResponse = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    settings: {
      defaultPageVisibility: "workspace" | "public_link" | "private";
      allowGuestAccess: boolean;
    };
  };
  viewerRole: "OWNER" | "EDITOR" | "VIEWER" | "MEMBER";
  members: Array<{
    id: string;
    role: "OWNER" | "EDITOR" | "VIEWER" | "MEMBER";
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl bg-[var(--color-surface)] p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {description ? (
          <p className="text-xs text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
      <div className="space-y-1">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
        {description ? (
          <div className="text-xs text-[var(--color-text-secondary)]">{description}</div>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DisabledPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-hover)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

function ActionButton({
  children,
  disabled,
  variant = "primary",
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const styles =
    variant === "primary"
      ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
      : variant === "danger"
        ? "bg-[#D44C47] text-white hover:opacity-90"
        : variant === "secondary"
          ? "bg-[var(--color-hover)] text-[var(--color-text-primary)] hover:opacity-90"
          : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspaceId,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [workspaceSettings, setWorkspaceSettings] =
    useState<WorkspaceSettingsResponse | null>(null);
  const [draftName, setDraftName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<ObnofiTheme>("light");

  const themeLabel = useMemo(() => theme, [theme]);
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    setTheme(getResolvedTheme());

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const [profileResponse, workspaceResponse] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch(`/api/workspaces/${workspaceId}/settings`, { cache: "no-store" }),
        ]);

        const profileData = (await profileResponse.json()) as ProfileResponse | { error?: string };
        const workspaceData = (await workspaceResponse.json()) as
          | WorkspaceSettingsResponse
          | { error?: string };

        if (!profileResponse.ok || !("email" in profileData)) {
          throw new Error(
            ("error" in profileData && profileData.error) || "계정 설정을 불러오지 못했습니다."
          );
        }

        if (!workspaceResponse.ok || !("workspace" in workspaceData)) {
          throw new Error(
            ("error" in workspaceData && workspaceData.error) ||
              "워크스페이스 설정을 불러오지 못했습니다."
          );
        }

        if (cancelled) {
          return;
        }

        setProfile(profileData);
        setDraftName(profileData.name ?? "");
        setSelectedImage(
          profileData.image && profileImagePresets.includes(profileData.image)
            ? profileData.image
            : profileImagePresets[0]
        );
        setWorkspaceSettings(workspaceData);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "설정 정보를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [isOpen, workspaceId]);

  const trimmedName = draftName.trim();
  const canSaveProfile =
    !!profile &&
    !!trimmedName &&
    !isSavingProfile &&
    (trimmedName !== (profile.name ?? "") || selectedImage !== profile.image);

  const connectedAccounts = profile?.connectedAccounts ?? [];
  const defaultVisibilityLabel =
    workspaceSettings?.workspace.settings.defaultPageVisibility === "public_link"
      ? "링크 있으면 누구나"
      : workspaceSettings?.workspace.settings.defaultPageVisibility === "private"
        ? "비공개"
        : "워크스페이스 내";

  const handleSaveProfile = async () => {
    if (!profile || !trimmedName) {
      return;
    }

    setIsSavingProfile(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          image: selectedImage,
        }),
      });

      const data = (await response.json()) as ProfileResponse | { error?: string };
      if (!response.ok || !("email" in data)) {
        throw new Error(("error" in data && data.error) || "프로필을 저장하지 못했습니다.");
      }

      setProfile(data);
      setDraftName(data.name ?? "");
      setSelectedImage(
        data.image && profileImagePresets.includes(data.image)
          ? data.image
          : profileImagePresets[0]
      );
      setSuccessMessage("프로필을 저장했습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 저장하지 못했습니다."
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleThemeChange = (nextTheme: ObnofiTheme) => {
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[88vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
        <aside className="flex w-[260px] shrink-0 flex-col bg-[var(--color-surface)] p-4">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-placeholder)]">
                Settings
              </div>
              <h2 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                Workspace Control
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                activeTab === "account"
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              }`}
            >
              <User className="h-4 w-4" />
              계정 설정
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("workspace")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                activeTab === "workspace"
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              }`}
            >
              <Users className="h-4 w-4" />
              워크스페이스 설정
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-[var(--color-background)] p-3 text-xs text-[var(--color-text-secondary)]">
            저장 가능한 항목은 현재 프로필만 연결되어 있습니다. 나머지 항목은 모달 안에서 구조를 먼저 정리해 둔 상태입니다.
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">
              설정 정보를 불러오는 중...
            </div>
          ) : errorMessage && !profile && !workspaceSettings ? (
            <div className="rounded-xl bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-secondary)]">
              {errorMessage}
            </div>
          ) : activeTab === "account" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  계정 설정
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  프로필과 개인 환경설정을 이곳에서 확인합니다.
                </p>
              </div>

              {errorMessage ? (
                <div className="rounded-lg bg-[var(--color-surface)] px-4 py-3 text-sm text-[#D44C47]">
                  {errorMessage}
                </div>
              ) : null}
              {successMessage ? (
                <div className="rounded-lg bg-[var(--color-accent-subtle)] px-4 py-3 text-sm text-[var(--color-accent)]">
                  {successMessage}
                </div>
              ) : null}

              <Section
                title="프로필"
                description="이름, 아바타, 이메일을 확인하고 프로필 이름과 아바타를 수정할 수 있습니다."
              >
                <div className="grid gap-6 lg:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="flex flex-col items-center gap-3">
                    {selectedImage ? (
                      <Image
                        src={selectedImage}
                        alt={trimmedName || profile?.name || "Profile"}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent)] text-3xl font-semibold text-white">
                        {(trimmedName || profile?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {profile ? formatDate(profile.createdAt) : ""} 가입
                    </div>
                  </div>

                  <div className="space-y-5">
                    <Row label="이름">
                      <input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        maxLength={80}
                        className="w-full rounded-md bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-accent)]"
                        placeholder="이름을 입력하세요"
                      />
                    </Row>

                    <Row label="이메일">
                      <div className="flex h-10 items-center rounded-md bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
                        {profile?.email ?? "—"}
                      </div>
                    </Row>

                    <Row label="아바타 프리셋">
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {profileImagePresets.map((preset) => {
                          const isActive = selectedImage === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setSelectedImage(preset)}
                              className={`rounded-full p-1 transition ${
                                isActive
                                  ? "bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent)]"
                                  : "hover:bg-[var(--color-hover)]"
                              }`}
                              aria-label="프로필 이미지 선택"
                            >
                              <Image
                                src={preset}
                                alt=""
                                width={44}
                                height={44}
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </Row>

                    <div className="flex justify-end">
                      <ActionButton
                        onClick={() => void handleSaveProfile()}
                        disabled={!canSaveProfile}
                      >
                        {isSavingProfile ? "저장 중..." : "프로필 저장"}
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </Section>

              <Section
                title="보안"
                description="비밀번호 변경과 로그인 관련 항목입니다."
              >
                <Row
                  label="비밀번호 변경"
                  description="현재 계정은 OAuth 또는 개발용 로그인과 함께 사용됩니다."
                >
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
                      <KeyRound className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      비밀번호 변경 플로우
                    </div>
                    <DisabledPill>준비 중</DisabledPill>
                  </div>
                </Row>
              </Section>

              <Section
                title="연동 계정"
                description="GitHub, Google 등 OAuth 제공자 연결 상태입니다."
              >
                {["google", "github"].map((provider) => {
                  const connected = connectedAccounts.includes(provider);
                  return (
                    <div
                      key={provider}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium capitalize text-[var(--color-text-primary)]">
                          {provider}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {connected ? "현재 연결됨" : "아직 연결되지 않음"}
                        </div>
                      </div>
                      <DisabledPill>{connected ? "연결됨" : "미연결"}</DisabledPill>
                    </div>
                  );
                })}
              </Section>

              <Section
                title="언어 / 지역"
                description="브라우저에서 감지한 현재 언어와 지역 정보입니다."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                      <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      인터페이스 언어
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{locale}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">지역 / 시간대</div>
                    <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{timeZone}</div>
                  </div>
                </div>
              </Section>

              <Section title="테마" description="모드를 선택하면 바로 인터페이스에 적용됩니다.">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: "light", label: "라이트", icon: <Sun className="h-4 w-4" /> },
                    { id: "dark", label: "다크", icon: <Moon className="h-4 w-4" /> },
                    { id: "jungle", label: "정글", icon: <Globe className="h-4 w-4" /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleThemeChange(item.id as ObnofiTheme)}
                      className={`rounded-lg px-4 py-3 ring-1 ${
                        themeLabel === item.id
                          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-[var(--color-accent)]"
                          : "bg-[var(--color-background)] text-[var(--color-text-secondary)] ring-[var(--color-border)] hover:bg-[var(--color-hover)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {item.icon}
                        {item.label}
                      </div>
                      <div className="mt-2 text-xs">
                        {themeLabel === item.id ? "현재 적용됨" : "클릭해서 적용"}
                      </div>
                    </button>
                  ))}
                </div>
              </Section>

              <Section
                title="알림"
                description="이메일 및 푸시 알림 채널 구성을 위한 자리입니다."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                      <Mail className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      이메일 알림
                    </div>
                    <DisabledPill>준비 중</DisabledPill>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                      <Bell className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      푸시 알림
                    </div>
                    <DisabledPill>준비 중</DisabledPill>
                  </div>
                </div>
              </Section>

              <Section
                title="계정 삭제"
                description="삭제는 아직 서버 보호 절차가 준비되지 않아 비활성화되어 있습니다."
              >
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">
                      계정 영구 삭제
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      삭제 전에 워크스페이스 소유권 이전과 데이터 정리 플로우가 필요합니다.
                    </div>
                  </div>
                  <ActionButton disabled variant="danger">
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </ActionButton>
                </div>
              </Section>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  워크스페이스 설정
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  일반 정보, 멤버, 접근 및 보안 구성을 한곳에서 확인합니다.
                </p>
              </div>

              <Section title="일반" description="이름, 아이콘, 도메인, 삭제 관련 항목입니다.">
                <Row label="워크스페이스 이름 / 아이콘">
                  <div className="flex items-center gap-3 rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] text-lg">
                      {workspaceSettings?.workspace.icon ?? "🌿"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {workspaceSettings?.workspace.name ?? "Workspace"}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        내 역할: {workspaceSettings?.viewerRole ?? "—"}
                      </div>
                    </div>
                  </div>
                </Row>

                <Row label="도메인 설정" description="현재 slug 기반 경로를 사용합니다.">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div>
                      <div className="text-sm text-[var(--color-text-primary)]">
                        obnofi.so/{workspaceSettings?.workspace.slug ?? "workspace"}
                      </div>
                      <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        커스텀 URL 연결은 아직 미구현입니다.
                      </div>
                    </div>
                    <DisabledPill>준비 중</DisabledPill>
                  </div>
                </Row>

                <Row label="워크스페이스 삭제">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      멤버, 페이지, 데이터베이스를 포함한 전체 데이터 삭제 플로우는 아직 연결되지 않았습니다.
                    </div>
                    <ActionButton disabled variant="danger">
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </ActionButton>
                  </div>
                </Row>
              </Section>

              <Section title="멤버" description="초대와 권한 관리를 위한 영역입니다.">
                <Row label="멤버 초대">
                  <div className="flex gap-2">
                    <input
                      disabled
                      value=""
                      readOnly
                      placeholder="name@example.com"
                      className="h-10 flex-1 rounded-md bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-secondary)] outline-none ring-1 ring-[var(--color-border)]"
                    />
                    <ActionButton disabled variant="secondary">
                      초대
                    </ActionButton>
                  </div>
                </Row>

                <Row label="초대 링크 생성">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                      <Link2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      링크 기반 초대
                    </div>
                    <DisabledPill>준비 중</DisabledPill>
                  </div>
                </Row>

                <div className="space-y-3">
                  {(workspaceSettings?.members ?? []).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {member.user.image ? (
                          <Image
                            src={member.user.image}
                            alt={member.user.name ?? member.user.email}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white">
                            {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                            {member.user.name ?? "이름 없음"}
                          </div>
                          <div className="truncate text-xs text-[var(--color-text-secondary)]">
                            {member.user.email} · {formatDate(member.joinedAt)} 참여
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-[var(--color-hover)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)]">
                          {member.role.toLowerCase()}
                        </div>
                        <ActionButton disabled variant="ghost">
                          제거
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="접근 / 보안"
                description="기본 공개 범위와 게스트 접근 정책입니다."
              >
                <Row label="기본 페이지 공개 범위">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                      <Shield className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      {defaultVisibilityLabel}
                    </div>
                    <DisabledPill>읽기 전용</DisabledPill>
                  </div>
                </Row>

                <Row label="게스트 접근">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
                    <div className="text-sm text-[var(--color-text-primary)]">
                      {workspaceSettings?.workspace.settings.allowGuestAccess
                        ? "허용됨"
                        : "비허용"}
                    </div>
                    <DisabledPill>읽기 전용</DisabledPill>
                  </div>
                </Row>
              </Section>

              <Section
                title="추가 작업"
                description="설정 페이지를 별도 화면으로 열고 싶다면 기존 경로도 유지됩니다."
              >
                <a
                  href="/settings"
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline"
                >
                  전체 설정 페이지 열기
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
