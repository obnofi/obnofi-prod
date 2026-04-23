"use client";

import { useState } from "react";
import { User, Mail, Calendar, Shield, AlertTriangle, LogOut, Smartphone } from "lucide-react";
import Image from "next/image";

// Reusable Components
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
  danger,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium ${danger ? "text-red-500" : "text-[var(--color-text-primary)]"}`}>
          {label}
        </div>
        {description && (
          <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{description}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
    secondary:
      "bg-[var(--color-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-selected)] border border-[var(--color-border)]",
    ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-6 text-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
        checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Account Settings Page
export default function AccountSettingsPage() {
  const [displayName, setDisplayName] = useState("John Doe");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock data - would come from auth/session
  const user = {
    email: "john.doe@example.com",
    avatar: null, // would be Google OAuth avatar URL
    connectedGoogle: {
      email: "john.doe@gmail.com",
      connectedAt: "2024-01-15",
    },
    sessions: [
      { id: "1", device: "Chrome on macOS", location: "Seoul, South Korea", current: true },
      { id: "2", device: "Safari on iPhone", location: "Seoul, South Korea", current: false },
    ],
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    // TODO: Save to API
  };

  const handleDisconnectGoogle = () => {
    // TODO: Disconnect Google account
    alert("Disconnect Google account - to be implemented");
  };

  const handleSignOutAll = () => {
    // TODO: Sign out all other sessions
    alert("Sign out all other sessions - to be implemented");
  };

  const handleDeleteAccount = () => {
    // TODO: Delete account
    alert("Delete account - to be implemented");
    setShowDeleteConfirm(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">My Account</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Manage your profile, connected accounts, and account security.
        </p>
      </div>

      {/* Profile Section */}
      <SettingSection title="Profile" description="Your public profile information">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              {/* Display Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Display Name
                </label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleNameSave}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingName(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-primary)]">{displayName}</span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingName(true)}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Email
                </label>
                <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                  <Mail className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Connected Accounts */}
      <SettingSection title="Connected Accounts" description="Manage your linked accounts and sign-in methods">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">Google</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {user.connectedGoogle.email} • Connected on {user.connectedGoogle.connectedAt}
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDisconnectGoogle}>
              Disconnect
            </Button>
          </div>
        </div>
      </SettingSection>

      {/* Active Sessions */}
      <SettingSection title="Active Sessions" description="Devices currently logged into your account">
        <div className="space-y-2">
          {user.sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-hover)]">
                  <Smartphone className="h-5 w-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                    {session.device}
                    {session.current && (
                      <span className="rounded-full bg-[var(--color-accent-subtle)] px-2 py-0.5 text-xs text-[var(--color-accent)]">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{session.location}</div>
                </div>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm">
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={handleSignOutAll}>
            Sign out all other sessions
          </Button>
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection title="Danger Zone">
        <SettingRow
          label="Delete my account"
          description="Permanently delete your account and all associated data. This action cannot be undone."
          danger
        >
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            Delete account
          </Button>
        </SettingRow>
      </SettingSection>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Delete Account?</h3>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              This will permanently delete your account, all your pages, databases, and settings.
              This action <strong className="text-[var(--color-text-primary)]">cannot be undone</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteAccount}>
                Yes, delete my account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
