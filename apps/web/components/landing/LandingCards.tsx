"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl" style={{ background: "#F7F7F5" }}>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ background: "#E8F5EC", color: "#2E7D45" }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-2" style={{ color: "#37352F" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#787774" }}>
        {description}
      </p>
    </div>
  );
}

export function RoleCard({
  icon,
  title,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  features: string[];
}) {
  return (
    <div
      className="p-6 rounded-xl h-full"
      style={{ background: "#FFFFFF", border: "1px solid #E3E2E0" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "#E8F5EC", color: "#2E7D45" }}
        >
          {icon}
        </div>
        <h3 className="font-semibold text-base" style={{ color: "#37352F" }}>
          {title}
        </h3>
      </div>
      <ul className="space-y-3">
        {features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm"
            style={{ color: "#787774" }}
          >
            <Check
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "#2E7D45" }}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #E3E2E0" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-medium text-base" style={{ color: "#37352F" }}>
          {question}
        </span>
        <span
          className="text-xl transition-transform duration-200"
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0)",
            color: "#787774",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-sm leading-relaxed" style={{ color: "#787774" }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
