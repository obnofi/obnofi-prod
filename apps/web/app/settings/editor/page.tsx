"use client";

import { useState } from "react";
import { Type, Check, Zap } from "lucide-react";

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

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
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
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {option.label}
        </button>
      ))}
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

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-32 cursor-pointer appearance-none rounded-lg bg-[var(--color-border)] accent-[var(--color-accent)]"
      />
      <span className="min-w-[3rem] text-sm text-[var(--color-text-secondary)]">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  );
}

// Editor Settings Page
export default function EditorSettingsPage() {
  const [defaultFont, setDefaultFont] = useState<"pretendard" | "noto" | "system">("pretendard");
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [autoSave, setAutoSave] = useState<"realtime" | "5s" | "30s">("realtime");
  const [spellCheck, setSpellCheck] = useState(true);
  const [vimMode, setVimMode] = useState(false);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Editor</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Customize your writing and editing experience.
        </p>
      </div>

      {/* Typography */}
      <SettingSection title="Typography" description="Customize text appearance">
        <SettingRow label="Default Font" description="Choose your preferred font family">
          <Select
            value={defaultFont}
            onChange={(value) => setDefaultFont(value as "pretendard" | "noto" | "system")}
            options={[
              { value: "pretendard", label: "Pretendard" },
              { value: "noto", label: "Noto Sans KR" },
              { value: "system", label: "System Default" },
            ]}
          />
        </SettingRow>

        <SettingRow label="Font Size" description="Adjust the base font size">
          <Slider
            value={fontSize}
            min={12}
            max={20}
            step={1}
            onChange={setFontSize}
            formatValue={(v) => `${v}px`}
          />
        </SettingRow>

        <SettingRow label="Line Height" description="Adjust the spacing between lines">
          <Slider
            value={lineHeight}
            min={1.4}
            max={2.0}
            step={0.1}
            onChange={setLineHeight}
            formatValue={(v) => v.toFixed(1)}
          />
        </SettingRow>
      </SettingSection>

      {/* Auto-save */}
      <SettingSection title="Auto-save" description="Control how your changes are saved">
        <SettingRow label="Auto-save Interval" description="How often to save your changes">
          <SegmentedControl
            options={[
              { value: "realtime", label: "Real-time" },
              { value: "5s", label: "5 seconds" },
              { value: "30s", label: "30 seconds" },
            ]}
            value={autoSave}
            onChange={setAutoSave}
          />
        </SettingRow>
      </SettingSection>

      {/* Features */}
      <SettingSection title="Features" description="Enable or disable editor features">
        <SettingRow label="Spell Check" description="Highlight spelling errors as you type">
          <Toggle checked={spellCheck} onChange={setSpellCheck} />
        </SettingRow>

        <SettingRow label="Vim Keybindings" description="Use Vim-style keyboard shortcuts">
          <Toggle checked={vimMode} onChange={setVimMode} />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
