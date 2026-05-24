import type { Page } from "@playwright/test";

export function getUserId(username: string) {
  return `dev-user-${username}`;
}

function numericHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getUserColor(userId: string): string {
  return `hsl(${numericHash(userId) % 360} 65% 58%)`;
}

export async function signInAs(page: Page, username: string) {
  const request = page.context().request;
  const csrfResponse = await request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken, callbackUrl: "/workspace", json: "true", username },
  });
}

export async function getWorkspaceId(page: Page, username: string): Promise<string> {
  await signInAs(page, username);
  await page.goto("/workspace");
  await page.waitForURL(/\/workspace\/[^/?]+/);
  const match = page.url().match(/\/workspace\/([^/?]+)/);
  if (!match) throw new Error("Could not parse workspaceId from URL");
  return match[1];
}

export async function createCollabPage(
  page: Page,
  workspaceId: string,
  type: "document" | "canvas" | "database",
  title: string,
  collaboratorUsernames: string[] = [],
  options: {
    collaborationEnabled?: boolean;
    lineIndicatorEnabled?: boolean;
  } = {}
): Promise<{ id: string; databaseId?: string }> {
  const res = await page.context().request.post("/api/pages", {
    data: {
      title,
      type,
      workspaceId,
      collaborationEnabled: options.collaborationEnabled,
      lineIndicatorEnabled: options.lineIndicatorEnabled,
    },
  });
  if (!res.ok()) throw new Error(`POST /api/pages failed: ${await res.text()}`);
  const created = (await res.json()) as { id: string; databaseId?: string };

  if (options.collaborationEnabled !== false) {
    await page.context().request.patch(`/api/pages/${created.id}`, {
      data: {
        collaborationEnabled: true,
        lineIndicatorEnabled: options.lineIndicatorEnabled ?? false,
      },
    });
  }

  for (const username of collaboratorUsernames) {
    const email = `${username}@obnofi.com`;
    const colRes = await page.context().request.post(`/api/pages/${created.id}/collaborators`, {
      data: { email, role: "editor" },
    });
    if (!colRes.ok()) {
      throw new Error(`POST collaborators failed for ${username}: ${await colRes.text()}`);
    }
  }

  return created;
}

export async function createDatabaseRow(
  page: Page,
  databaseId: string
): Promise<{ id: string }> {
  const res = await page.context().request.post(`/api/databases/${databaseId}/rows`, {
    data: { title: "Test Row" },
  });
  if (!res.ok()) throw new Error(`POST rows failed: ${await res.text()}`);
  return (await res.json()) as { id: string };
}
