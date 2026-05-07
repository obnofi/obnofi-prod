import {
  PageType as PrismaPageType,
  PropertyType as PrismaPropertyType,
  ViewType as PrismaViewType,
} from "@obnofi/db";
import type {
  GroveTitleLevel,
  PageHeadingFontSizes,
  PageHighlightColor,
  Page,
  Property,
  PropertyValue,
  Database,
  SelectOption,
  View,
} from "@obnofi/types";
import { normalizeTiptapDocument } from "@/lib/normalizeTiptapDocument";

// ── Enum converters ────────────────────────────────────────────────────────

export function fromPrismaPageType(
  t: PrismaPageType
): "document" | "canvas" | "database" {
  return t.toLowerCase() as "document" | "canvas" | "database";
}

export function toPrismaPageType(t: string): PrismaPageType {
  return t.toUpperCase() as PrismaPageType;
}

export function fromPrismaPropertyType(t: PrismaPropertyType): string {
  return t.toLowerCase();
}

export function toPrismaPropertyType(t: string): PrismaPropertyType {
  return t.toUpperCase() as PrismaPropertyType;
}

export function fromPrismaViewType(t: PrismaViewType): string {
  return t.toLowerCase();
}

export function toPrismaViewType(t: string): PrismaViewType {
  return t.toUpperCase() as PrismaViewType;
}

// ── Select / Include constants ─────────────────────────────────────────────

/** Full fetch including content — use only when opening a single page for editing */
export const PAGE_INCLUDE = {
  database: { select: { id: true } },
  yjsDocument: { select: { updatedAt: true } },
} as const;

/**
 * All scalar fields except `content` — use for list queries (sidebar, search, etc.)
 * where document body is not needed. Dramatically reduces payload size.
 */
export const PAGE_SELECT = {
  id: true,
  title: true,
  groveTitleLevel: true,
  bodyFontSizePt: true,
  heading1FontSizePt: true,
  heading2FontSizePt: true,
  heading3FontSizePt: true,
  heading4FontSizePt: true,
  heading5FontSizePt: true,
  highlightColors: true,
  type: true,
  icon: true,
  coverImage: true,
  parentId: true,
  order: true,
  workspaceId: true,
  parentDatabaseId: true,
  isPublic: true,
  shareId: true,
  sharePassword: true,
  createdAt: true,
  updatedAt: true,
  database: { select: { id: true } },
  yjsDocument: { select: { updatedAt: true } },
} as const;

/** PAGE_SELECT + propertyValues — use for database rows in table/board views */
export const PAGE_SELECT_WITH_PROPERTY_VALUES = {
  ...PAGE_SELECT,
  propertyValues: true,
} as const;

// ── Row types (Prisma result shapes) ──────────────────────────────────────

export type PrismaPageRow = {
  id: string;
  title: string;
  groveTitleLevel?: number | null;
  bodyFontSizePt?: number | null;
  heading1FontSizePt?: number | null;
  heading2FontSizePt?: number | null;
  heading3FontSizePt?: number | null;
  heading4FontSizePt?: number | null;
  heading5FontSizePt?: number | null;
  highlightColors?: string[] | null;
  content?: unknown | null; // optional — omitted in list/row queries
  type: PrismaPageType;
  icon: string | null;
  coverImage: string | null;
  parentId: string | null;
  order: number;
  workspaceId: string;
  parentDatabaseId: string | null;
  isPublic: boolean;
  shareId: string | null;
  sharePassword: string | null;
  createdAt: Date;
  updatedAt: Date;
  database?: { id: string } | null;
  yjsDocument?: { updatedAt: Date } | null;
};

type PrismaPropertyRow = {
  id: string;
  databaseId: string;
  name: string;
  type: PrismaPropertyType;
  options: unknown | null;
  order: number;
  relationConfig: unknown | null;
  rollupConfig: unknown | null;
  formulaConfig: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaPropertyValueRow = {
  id: string;
  pageId: string;
  propertyId: string;
  value: unknown;
  updatedAt: Date;
};

type PrismaViewRow = {
  id: string;
  databaseId: string;
  name: string;
  type: PrismaViewType;
  config: unknown;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaDatabaseRow = {
  id: string;
  pageId: string;
  createdAt: Date;
  updatedAt: Date;
  properties: PrismaPropertyRow[];
  views: PrismaViewRow[];
  rows: (PrismaPageRow & { propertyValues: PrismaPropertyValueRow[] })[];
};

// ── Mappers ────────────────────────────────────────────────────────────────

export function toPage(p: PrismaPageRow): Page {
  const headingFontSizes: PageHeadingFontSizes = {
    h1: p.heading1FontSizePt ?? 30,
    h2: p.heading2FontSizePt ?? 23,
    h3: p.heading3FontSizePt ?? 18,
    h4: p.heading4FontSizePt ?? 16,
    h5: p.heading5FontSizePt ?? 14,
  };

  return {
    id: p.id,
    title: p.title,
    groveTitleLevel: (p.groveTitleLevel ?? 1) as GroveTitleLevel,
    bodyFontSizePt: p.bodyFontSizePt ?? 12,
    headingFontSizes,
    highlightColors: (p.highlightColors?.length
      ? p.highlightColors
      : ["yellow", "green", "blue", "pink"]) as PageHighlightColor[],
    content:
      p.type === PrismaPageType.DOCUMENT && p.content !== undefined
        ? normalizeTiptapDocument((p.content as object | null) ?? null)
        : p.content !== undefined
          ? (p.content as object | null) ?? null
          : null,
    type: fromPrismaPageType(p.type),
    icon: p.icon ?? null,
    coverImage: p.coverImage ?? null,
    parentId: p.parentId ?? null,
    order: p.order,
    workspaceId: p.workspaceId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    yjsUpdatedAt: p.yjsDocument?.updatedAt.toISOString() ?? null,
    isPublic: p.isPublic,
    shareId: p.shareId ?? null,
    sharePassword: p.sharePassword ?? null,
    databaseId: p.database?.id ?? null,
    parentDatabaseId: p.parentDatabaseId ?? null,
  };
}

export function toProperty(p: PrismaPropertyRow): Property {
  return {
    id: p.id,
    databaseId: p.databaseId,
    name: p.name,
    type: fromPrismaPropertyType(p.type) as Property["type"],
    options: (p.options as SelectOption[] | undefined) ?? undefined,
    order: p.order,
    relationConfig: (p.relationConfig as Property["relationConfig"]) ?? undefined,
    rollupConfig: (p.rollupConfig as Property["rollupConfig"]) ?? undefined,
    formulaConfig: (p.formulaConfig as Property["formulaConfig"]) ?? undefined,
  };
}

export function toPropertyValue(pv: PrismaPropertyValueRow): PropertyValue {
  return {
    id: pv.id,
    pageId: pv.pageId,
    propertyId: pv.propertyId,
    columnId: pv.propertyId, // legacy alias
    value: pv.value as PropertyValue["value"],
  };
}

export function toView(v: PrismaViewRow): View {
  return {
    id: v.id,
    databaseId: v.databaseId,
    name: v.name,
    type: fromPrismaViewType(v.type) as View["type"],
    config: (v.config as View["config"]) ?? {
      visibleProperties: [],
      propertyWidths: {},
      sorts: [],
      filters: [],
    },
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export function toDatabase(db: PrismaDatabaseRow): Database {
  const properties = db.properties.map(toProperty);
  const views = db.views.map(toView);
  const rows = db.rows.map((row) => ({
    ...toPage(row),
    propertyValues: row.propertyValues.map(toPropertyValue),
  }));

  return {
    id: db.id,
    pageId: db.pageId,
    properties,
    columns: properties, // legacy alias
    rows,
    views,
  };
}
