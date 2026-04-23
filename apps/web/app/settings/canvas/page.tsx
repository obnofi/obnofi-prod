"use client";

import { useState } from "react";
import { Grid3X3, Circle, Square, Magnet, Map, MousePointer2 } from "lucide-react";

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

function IconSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
            value === option.value
              ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
              : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-hover)]"
          }`}
        >
          <span className={value === option.value ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}>
            {option.icon}
          </span>
          <span className={`text-xs ${value === option.value ? "text-[var(--color-accent)] font-medium" : "text-[var(--color-text-secondary)]"}`}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  labels,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  labels?: { min: string; max: string };
}) {
  return (
    <div className="flex flex-col gap-2">
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
      </div>
      {labels && (
        <div className="flex w-32 justify-between text-xs text-[var(--color-text-secondary)]">
          <span>{labels.min}</span>
          <span>{labels.max}</span>
        </div>
      )}
    </div>
  );
}

// Canvas Settings Page
export default function CanvasSettingsPage() {
  const [background, setBackground] = useState<"grid" | "dots" | "none">("grid");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [gestureSensitivity, setGestureSensitivity] = useState(50);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Canvas</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Customize your infinite canvas experience.
        </p>
      </div>

      {/* Default Background */}
      <SettingSection title="Default Background" description="Choose the default background style for new canvases">
        <SettingRow label="Background Style" description="Visual guide for the canvas">
          <IconSelector
            options={[
              { value: "grid", label: "Grid", icon: <Grid3X3 className="h-6 w-6" /> },
              { value: "dots", label: "Dots", icon: <Circle className="h-6 w-6" /> },
              { value: "none", label: "None", icon: <Square className="h-6 w-6" /> },
            ]}
            value={background}
            onChange={setBackground}
          />
        </SettingRow>
      </SettingSection>

      {/* Canvas Behavior */}
      <SettingSection title="Canvas Behavior" description="Control how elements interact on the canvas">
        <SettingRow label="Snap to Grid" description="Automatically align elements to the grid">
          <Toggle checked={snapToGrid} onChange={setSnapToGrid} />
        </SettingRow>

        <SettingRow label="Show Minimap" description="Display a navigation overview in the corner">
          <Toggle checked={showMinimap} onChange={setShowMinimap} />
        </SettingRow>
      </SettingSection>

      {/* Input */}
      <SettingSection title="Input" description="Adjust input sensitivity">
        <SettingRow label="Gesture Sensitivity" description="Adjust zoom and pan sensitivity">
          <Slider
            value={gestureSensitivity}
            min={0}
            max={100}
            step={10}
            onChange={setGestureSensitivity}
            labels={{ min: "Trackpad", max: "Mouse" }}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
