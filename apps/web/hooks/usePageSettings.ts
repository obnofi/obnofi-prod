"use client";

import { useState, useRef, useEffect } from "react";
import { copyToClipboard } from "@/lib/copyToClipboard";
import type {
  HeadingLevel,
  PageCollaborator,
  PageHeadingFontSizes,
  PageHighlightColor,
} from "@obnofi/types";
import type { PageExportFormat } from "@/components/workspace/PageSettingsMenu";

interface UsePageSettingsOptions {
  pageId: string;
  workspaceId: string;
  isOpen: boolean;
  headingFontSizes: PageHeadingFontSizes;
  highlightColors: PageHighlightColor[];
  collaborationEnabled: boolean;
  onHeadingFontSizesChange: (sizes: PageHeadingFontSizes) => void;
  onHighlightColorsChange: (colors: PageHighlightColor[]) => void;
  onExport?: (format: PageExportFormat) => void;
  onClose: () => void;
}

export function usePageSettings({
  pageId,
  workspaceId,
  isOpen,
  headingFontSizes,
  highlightColors,
  collaborationEnabled,
  onHeadingFontSizesChange,
  onHighlightColorsChange,
  onExport,
  onClose,
}: UsePageSettingsOptions) {
  const [collabCopied, setCollabCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHeadingFontSizeOpen, setIsHeadingFontSizeOpen] = useState(false);
  const [isHighlightColorsOpen, setIsHighlightColorsOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [collabInviteEmail, setCollabInviteEmail] = useState("");
  const [collabInviteLoading, setCollabInviteLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<PageCollaborator[]>([]);
  const [draftHeadingFontSizes, setDraftHeadingFontSizes] =
    useState<PageHeadingFontSizes>(headingFontSizes);
  const [editingHeadingLevel, setEditingHeadingLevel] = useState<HeadingLevel | null>(null);
  const highlightRequestIdRef = useRef(0);

  const collabUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/workspace/${workspaceId}?page=${pageId}`
      : "";

  // ── Reset sub-panels on close ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setIsExportOpen(false);
      setIsHeadingFontSizeOpen(false);
      setIsHighlightColorsOpen(false);
      setIsCollabOpen(false);
      setEditingHeadingLevel(null);
      setCollabInviteEmail("");
    }
  }, [isOpen]);

  // ── Load collaborators ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isCollabOpen || !collaborationEnabled) return;
    fetch(`/api/pages/${pageId}/collaborators`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PageCollaborator[]) => setCollaborators(data))
      .catch(() => {});
  }, [isCollabOpen, collaborationEnabled, pageId]);

  // ── Sync draft ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setDraftHeadingFontSizes(headingFontSizes);
  }, [headingFontSizes]);

  const handleCopyCollabLink = async () => {
    const copied = await copyToClipboard(collabUrl);
    if (!copied) return;
    setCollabCopied(true);
    setTimeout(() => setCollabCopied(false), 2000);
  };

  // ── Collaborator handlers ───────────────────────────────────────────────────
  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabInviteEmail.trim()) return;
    setCollabInviteLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collabInviteEmail.trim(), role: "editor" }),
      });
      if (res.ok) {
        const newCollaborator = (await res.json()) as PageCollaborator;
        setCollaborators((prev) => {
          const filtered = prev.filter((c) => c.userId !== newCollaborator.userId);
          return [...filtered, newCollaborator];
        });
        setCollabInviteEmail("");
      }
    } finally {
      setCollabInviteLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    await fetch(`/api/pages/${pageId}/collaborators/${userId}`, { method: "DELETE" });
    setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
  };

  // ── Heading font size handlers ──────────────────────────────────────────────
  const handleHeadingFontSizeChange = async (headingLevel: HeadingLevel, nextSize: number) => {
    const headingKey = `h${headingLevel}` as keyof PageHeadingFontSizes;
    if (headingFontSizes[headingKey] === nextSize) return;

    const nextHeadingFontSizes: PageHeadingFontSizes = { ...headingFontSizes, [headingKey]: nextSize };
    onHeadingFontSizesChange(nextHeadingFontSizes);

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headingFontSizes: { [headingKey]: nextSize } }),
      });
      if (!response.ok) throw new Error("Failed to update heading font size");
      const updatedPage = await response.json();
      onHeadingFontSizesChange(updatedPage.headingFontSizes);
    } catch {
      onHeadingFontSizesChange(headingFontSizes);
    }
  };

  const handleHeadingFontSizeDraftChange = (headingLevel: HeadingLevel, value: string) => {
    const headingKey = `h${headingLevel}` as keyof PageHeadingFontSizes;
    const parsedValue = Number.parseInt(value, 10);
    setDraftHeadingFontSizes((current) => ({
      ...current,
      [headingKey]: Number.isNaN(parsedValue) ? current[headingKey] : parsedValue,
    }));
  };

  const commitHeadingFontSizeDraft = async (headingLevel: HeadingLevel) => {
    const headingKey = `h${headingLevel}` as keyof PageHeadingFontSizes;
    const nextSize = draftHeadingFontSizes[headingKey];
    if (!Number.isInteger(nextSize) || nextSize < 8 || nextSize > 48) {
      setDraftHeadingFontSizes(headingFontSizes);
      setEditingHeadingLevel(null);
      return;
    }
    await handleHeadingFontSizeChange(headingLevel, nextSize);
    setEditingHeadingLevel(null);
  };

  // ── Highlight color handlers ────────────────────────────────────────────────
  const handleHighlightColorsToggle = async (color: PageHighlightColor) => {
    const previousHighlightColors = highlightColors;
    const nextHighlightColors = highlightColors.includes(color)
      ? highlightColors.filter((item) => item !== color)
      : [...highlightColors, color];
    if (nextHighlightColors.length === 0) return;

    const requestId = ++highlightRequestIdRef.current;
    onHighlightColorsChange(nextHighlightColors);

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ highlightColors: nextHighlightColors }),
      });
      if (!response.ok) throw new Error("Failed to update highlight colors");
      const updatedPage = await response.json();
      if (requestId === highlightRequestIdRef.current) {
        onHighlightColorsChange(updatedPage.highlightColors);
      }
    } catch {
      if (requestId === highlightRequestIdRef.current) {
        onHighlightColorsChange(previousHighlightColors);
      }
    }
  };

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = (format: PageExportFormat) => {
    onExport?.(format);
    setIsExportOpen(false);
    onClose();
  };

  return {
    // state
    collabCopied,
    isExportOpen,
    setIsExportOpen,
    isHeadingFontSizeOpen,
    setIsHeadingFontSizeOpen,
    isHighlightColorsOpen,
    setIsHighlightColorsOpen,
    isCollabOpen,
    setIsCollabOpen,
    collabInviteEmail,
    setCollabInviteEmail,
    collabInviteLoading,
    collaborators,
    draftHeadingFontSizes,
    setDraftHeadingFontSizes,
    editingHeadingLevel,
    setEditingHeadingLevel,
    // handlers
    handleCopyCollabLink,
    handleInviteCollaborator,
    handleRemoveCollaborator,
    handleHeadingFontSizeDraftChange,
    commitHeadingFontSizeDraft,
    handleHighlightColorsToggle,
    handleExport,
  };
}
