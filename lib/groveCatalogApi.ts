"use client";

import type {
  DatabasePage,
  Property,
  PropertyType,
  PropertyValue,
  PropertyValueData,
  SelectOption,
} from "@/types";

interface CreateGrovePropertyInput {
  name: string;
  type: PropertyType;
  options?: SelectOption[];
}

interface UpdateGrovePropertyInput {
  name?: string;
  type?: PropertyType;
  options?: SelectOption[];
}

const groveApiBaseUrl =
  process.env.NEXT_PUBLIC_FASTIFY_URL?.replace(/\/$/, "") ?? "";

function createGroveUrl(path: string) {
  if (!groveApiBaseUrl) {
    return path;
  }

  return `${groveApiBaseUrl}${path}`;
}

async function groveRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(createGroveUrl(path), init);
  if (!response.ok) {
    throw new Error(`Grove request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchGroveCatalogPage(pageId: string) {
  return groveRequest<DatabasePage>(`/api/pages/${pageId}?view=full`);
}

export async function patchGroveTitle(pageId: string, title: string) {
  return groveRequest<DatabasePage>(`/api/pages/${pageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function plantGroveSeed(databaseId: string, title: string) {
  return groveRequest<{ id: string }>(`/api/databases/${databaseId}/rows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function sproutGroveProperty(
  databaseId: string,
  input: CreateGrovePropertyInput
) {
  return groveRequest<Property>(`/api/databases/${databaseId}/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function reshapeGroveProperty(
  propertyId: string,
  input: UpdateGrovePropertyInput
) {
  return groveRequest<Property>(`/api/columns/${propertyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function pruneGroveProperty(propertyId: string) {
  await groveRequest<{ success: boolean }>(`/api/columns/${propertyId}`, {
    method: "DELETE",
  });
}

export async function renameGroveSeed(rowId: string, title: string) {
  await groveRequest(`/api/pages/${rowId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function patchGroveCell(
  rowId: string,
  propertyId: string,
  value: PropertyValueData
) {
  return groveRequest<PropertyValue>("/api/property-values", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageId: rowId,
      columnId: propertyId,
      value,
    }),
  });
}
