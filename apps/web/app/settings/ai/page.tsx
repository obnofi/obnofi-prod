"use client";

import { useState } from "react";
import { Bot, Globe, BarChart3 } from "lucide-react";

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
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{description}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
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

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variant === "accent"
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
          : "bg-[var(--color-hover)] text-[var(--color-text-secondary)]"
      }`}
    >
      {children}
    </span>
  );
}

// AI Settings Page
export default function AISettingsPage() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [responseLanguage, setResponseLanguage] = useState<"ko" | "en">("ko");

  // Mock usage stats
  const usageStats = {
    requestsThisMonth: 124,
    maxRequests: 500,
    resetDate: "2024-02-01",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">AI</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Configure AI-powered features and preferences.
        </p>
      </div>

      {/* AI Features */}
      <SettingSection title="AI Features" description="Enable or disable AI assistance">
        <SettingRow
          label="AI Features"
          description="Enable AI-powered writing assistance, summarization, and more"
        >
          <Toggle checked={aiEnabled} onChange={setAiEnabled} />
        </SettingRow>
      </SettingSection>

      {/* Response Language */}
      <SettingSection title="Response Language" description="Set your preferred AI response language">
        <SettingRow label="AI Response Language" description="The language AI will use for responses">
          <Select
            value={responseLanguage}
            onChange={(value) => setResponseLanguage(value as "ko" | "en")}
            options={[
              { value: "ko", label: "한국어 (Korean)" },
              { value: "en", label: "English" },
            ]}
          />
        </SettingRow>
      </SettingSection>

      {/* Usage Stats */}
      <SettingSection title="Usage Statistics" description="Monitor your AI usage">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
              <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                Requests This Month
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Resets on {usageStats.resetDate}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                {usageStats.requestsThisMonth} / {usageStats.maxRequests} requests
              </span>
              <Badge variant="accent">
                {Math.round((usageStats.requestsThisMonth / usageStats.maxRequests) * 100)}% used
              </Badge>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[var(--color-border)]">
              <div
                className="h-2 rounded-full bg-[var(--color-accent)] transition-all"
                style={{
                  width: `${(usageStats.requestsThisMonth / usageStats.maxRequests) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}
