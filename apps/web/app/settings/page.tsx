"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Mail, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { profileImagePresets } from "@/lib/profileImagePresets";

type ProfileRecord = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
};

function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Button({
  children,
  disabled,
  onClick,
  type = "button",
  variant = "primary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
      : variant === "secondary"
        ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
        : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass}`}
    >
      {children}
    </button>
  );
}

function formatJoinedDate(isoDate: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [draftName, setDraftName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status !== "loading") {
        setIsLoading(false);
      }
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        const data = (await response.json()) as ProfileRecord | { error?: string };

        if (!response.ok || !("email" in data)) {
          throw new Error(("error" in data && data.error) || "프로필을 불러오지 못했습니다.");
        }

        if (!isMounted) {
          return;
        }

        setProfile(data);
        setDraftName(data.name ?? "");
        setSelectedImage(
          data.image && profileImagePresets.includes(data.image)
            ? data.image
            : profileImagePresets[0]
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(
          error instanceof Error ? error.message : "프로필을 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [status]);

  const imageOptions = profileImagePresets;

  const trimmedName = draftName.trim();
  const canSave =
    !!profile &&
    trimmedName.length > 0 &&
    !isSaving &&
    (trimmedName !== (profile.name ?? "") || selectedImage !== profile.image);

  const previewName = trimmedName || profile?.name || session?.user?.name || "U";

  const handleSaveProfile = async () => {
    if (!profile || !trimmedName) {
      return;
    }

    setIsSaving(true);
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

      const data = (await response.json()) as ProfileRecord | { error?: string };
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
      await update({
        name: data.name ?? undefined,
        image: data.image ?? undefined,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-[var(--color-text-secondary)]">
        프로필을 불러오는 중...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-secondary)]">
        {errorMessage ?? "프로필을 불러오지 못했습니다."}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">My Account</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          프로필 이름과 사진은 계정에 저장되고, 이후 세션과 워크스페이스 전반에서 같은 값을 사용합니다.
        </p>
      </div>

      <SettingSection
        title="Profile"
        description="가입 시 정해진 프로필 이미지를 기본으로 쓰고, 원하면 여기서 직접 바꿀 수 있습니다."
      >
        <div className="rounded-lg bg-[var(--color-surface)] p-6">
          <div className="grid gap-8 lg:grid-cols-[120px_minmax(0,1fr)]">
            <div className="flex flex-col items-center gap-3">
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={previewName}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent)] text-3xl font-semibold text-white">
                  {previewName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-[var(--color-text-secondary)]">현재 프로필 사진</span>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  maxLength={80}
                  className="h-10 w-full rounded-md bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] transition focus:ring-2 focus:ring-[var(--color-accent)]"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
                  Profile Image
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {imageOptions.map((imageUrl, index) => {
                    const isSelected = imageUrl === selectedImage;
                    return (
                      <button
                        key={imageUrl}
                        type="button"
                        onClick={() => setSelectedImage(imageUrl)}
                        className={`rounded-full p-1 transition ${
                          isSelected ? "bg-[var(--color-accent-subtle)]" : "bg-transparent"
                        }`}
                        aria-label="Select profile image"
                      >
                        <Image
                          src={imageUrl}
                          alt="Profile preset"
                          width={56}
                          height={56}
                          className={`h-14 w-14 rounded-full object-cover ring-2 ${
                            isSelected
                              ? "ring-[var(--color-accent)]"
                              : "ring-transparent"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveProfile} disabled={!canSave}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={isSaving}
                  onClick={() => {
                    setDraftName(profile.name ?? "");
                    setSelectedImage(
                      profile.image && profileImagePresets.includes(profile.image)
                        ? profile.image
                        : profileImagePresets[0]
                    );
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                >
                  Reset
                </Button>
                {successMessage ? (
                  <span className="text-sm text-[var(--color-accent)]">{successMessage}</span>
                ) : null}
                {errorMessage ? (
                  <span className="text-sm text-red-500">{errorMessage}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title="Account"
        description="계정 자체 정보는 인증 공급자와 현재 저장된 사용자 레코드를 기준으로 표시합니다."
      >
        <div className="space-y-3 rounded-lg bg-[var(--color-surface)] p-6">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
            <Mail className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <span>{profile.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
            <User className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <span>{profile.name ?? "이름 없음"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
            <Calendar className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <span>{formatJoinedDate(profile.createdAt)} 가입</span>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}
