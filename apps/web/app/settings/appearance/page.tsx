"use client";

import { useState } from "react";
import { Monitor, Sun, Moon, Globe, Home, Clock, FileText } from "lucide-react";

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

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {option.icon && <span className="h-4 w-4">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
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

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; description?: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
            value === option.value
              ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-hover)]"
          }`}
        >
          <input
            type="radio"
            name="radio-group"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 h-4 w-4 border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
              {option.icon && <span className="text-[var(--color-text-secondary)]">{option.icon}</span>}
              {option.label}
            </div>
            {option.description && (
              <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{option.description}</div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

// Appearance Settings Page
export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [startPage, setStartPage] = useState<"last" | "home" | "specific">("last");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Appearance</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Customize how obnofi looks and feels for you.
        </p>
      </div>

      {/* Theme */}
      <SettingSection title="Theme" description="Choose your preferred color scheme">
        <SettingRow label="Appearance" description="Select a theme for the interface">
          <SegmentedControl
            options={[
              { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
              { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
              { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
            ]}
            value={theme}
            onChange={setTheme}
          />
        </SettingRow>
      </SettingSection>

      {/* Language */}
      <SettingSection title="Language" description="Set your preferred language">
        <SettingRow label="Display Language" description="Choose the language for the interface">
          <Select
            value={language}
            onChange={(value) => setLanguage(value as "ko" | "en")}
            options={[
              { value: "ko", label: "한국어 (Korean)" },
              { value: "en", label: "English" },
            ]}
          />
        </SettingRow>
      </SettingSection>

      {/* Start Page */}
      <SettingSection title="Start Page" description="Choose what page to show when you open obnofi">
        <RadioGroup
          options={[
            {
              value: "last",
              label: "Last visited",
              description: "Continue where you left off",
              icon: <Clock className="h-4 w-4" />,
            },
            {
              value: "home",
              label: "Home",
              description: "Your workspace home page",
              icon: <Home className="h-4 w-4" />,
            },
            {
              value: "specific",
              label: "Specific page",
              description: "A page you choose (coming soon)",
              icon: <FileText className="h-4 w-4" />,
            },
          ]}
          value={startPage}
          onChange={setStartPage}
        />
      </SettingSection>
    </div>
  );
}
