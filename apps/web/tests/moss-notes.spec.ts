import { test, expect, type Page } from "@playwright/test";

async function signInAsDeveloper(page: Page) {
  const request = page.context().request;
  const csrfResponse = await request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      callbackUrl: "/workspace",
      json: "true",
    },
  });
}

async function gotoWorkspaceDocument(page: Page) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/, { timeout: 15000 });

  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Playwright MossNote Page ${Date.now()}`,
      type: "document",
      workspaceId,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();

  const createdPage = (await createPageResponse.json()) as { id: string };
  await page.goto(`/workspace/${workspaceId}?page=${createdPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });

  return createdPage.id;
}

async function placeMossNote(page: Page, x = 300, y = 200) {
  await page.getByTestId("toolbar-moss-note").click();

  const surface = page.getByTestId("grove-page-surface");
  await expect(surface).toBeVisible();
  await surface.click({ position: { x, y } });

  const note = page.locator('[data-testid^="moss-note-"]').first();
  await expect(note).toBeVisible({ timeout: 5000 });
  return note;
}

/** 낙관적 ID → 실제 DB ID로 교체될 때까지 대기 */
async function waitForReconciliation(page: Page) {
  await expect(page.locator('[data-testid*="optimistic"]')).toHaveCount(0, {
    timeout: 8000,
  });
}

test("메모지 생성 — 서버 응답 전 즉시 화면에 표시", async ({ page }) => {
  let postResolve: (() => void) | null = null;

  await gotoWorkspaceDocument(page);

  await page.route("**/api/pages/*/moss-notes", async (route) => {
    if (route.request().method() !== "POST") {
      return route.continue();
    }
    await new Promise<void>((resolve) => {
      postResolve = resolve;
    });
    return route.continue();
  });

  await page.getByTestId("toolbar-moss-note").click();

  const surface = page.getByTestId("grove-page-surface");
  await surface.click({ position: { x: 300, y: 200 } });

  // Note must be visible before server responds
  const note = page.locator('[data-testid^="moss-note-"]').first();
  await expect(note).toBeVisible({ timeout: 3000 });

  // Unblock server
  postResolve?.();
});

test("메모지 body 편집 — 낙관적 업데이트 즉시 반영", async ({ page }) => {
  await gotoWorkspaceDocument(page);
  const note = await placeMossNote(page);

  // Click body to edit
  const bodyButton = note.locator("button").last();
  await bodyButton.click();

  const textarea = note.locator("textarea");
  await expect(textarea).toBeVisible();
  await textarea.fill("테스트 메모 내용");

  // Enter triggers saveEditing → optimistic body patch
  await page.keyboard.press("Enter");

  // Body shows immediately (optimistic, before server responds)
  await expect(note).toContainText("테스트 메모 내용");
});

test("메모지 PATCH 실패 시 해당 필드만 롤백", async ({ page }) => {
  await gotoWorkspaceDocument(page);
  const note = await placeMossNote(page);

  // Wait for optimistic ID to be replaced with real DB ID
  await waitForReconciliation(page);

  // Intercept PATCH to fail
  await page.route("**/api/pages/*/moss-notes/*", (route) => {
    if (route.request().method() === "PATCH") {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "서버 오류" }),
      });
    }
    return route.continue();
  });

  // Open context menu, change color to rose
  await note.click({ button: "right" });
  const roseButton = page.getByTitle("Rose");
  await expect(roseButton).toBeVisible({ timeout: 2000 });
  await roseButton.click();

  // Color change appears optimistically (sun → rose)
  await expect(note).toHaveClass(/bg-\[var\(--color-sticky-rose\)\]/, {
    timeout: 2000,
  });

  // Error shows after server rejects
  await expect(page.getByText("메모를 저장하지 못했습니다")).toBeVisible({
    timeout: 5000,
  });

  // Rollback: rose class removed, restored to previous color
  await expect(note).not.toHaveClass(/bg-\[var\(--color-sticky-rose\)\]/);
});

test("메모지 동시 PATCH — 선행 응답이 후속 낙관적 상태 덮어쓰지 않음", async ({
  page,
}) => {
  await gotoWorkspaceDocument(page);
  const note = await placeMossNote(page);

  // Wait for real note ID
  await waitForReconciliation(page);

  let bodyPatchResolve: (() => void) | null = null;

  await page.route("**/api/pages/*/moss-notes/*", async (route) => {
    const method = route.request().method();
    if (method !== "PATCH") return route.continue();

    const body = route.request().postDataJSON() as Record<string, unknown>;

    if ("body" in body) {
      // Delay body PATCH — color PATCH should resolve first
      await new Promise<void>((resolve) => {
        bodyPatchResolve = resolve;
      });
    }

    return route.continue();
  });

  // Edit body (triggers slow PATCH)
  const bodyButton = note.locator("button").last();
  await bodyButton.click();
  const textarea = note.locator("textarea");
  await textarea.fill("업데이트 본문");
  await page.keyboard.press("Enter");

  // While body PATCH is in-flight, change color via context menu
  await note.click({ button: "right" });
  const roseButton = page.getByTitle("Rose");
  await expect(roseButton).toBeVisible({ timeout: 2000 });
  await roseButton.click();

  // Color change must be visible optimistically
  await expect(note).toHaveClass(/bg-\[var\(--color-sticky-rose\)\]/, {
    timeout: 2000,
  });

  // Resolve delayed body PATCH — server responds
  bodyPatchResolve?.();
  await page.waitForTimeout(500);

  // Color must still be rose (body PATCH response must NOT overwrite color)
  await expect(note).toHaveClass(/bg-\[var\(--color-sticky-rose\)\]/);

  // Body still shows updated text
  await expect(note).toContainText("업데이트 본문");
});

test("메모지 삭제 — 서버 응답 전 즉시 제거", async ({ page }) => {
  await gotoWorkspaceDocument(page);
  const note = await placeMossNote(page);

  await page.waitForTimeout(500);

  let deleteResolve: (() => void) | null = null;
  await page.route("**/api/pages/*/moss-notes/*", async (route) => {
    if (route.request().method() === "DELETE") {
      await new Promise<void>((resolve) => {
        deleteResolve = resolve;
      });
      return route.continue();
    }
    return route.continue();
  });

  // Right-click → delete
  await note.click({ button: "right" });
  await page.getByRole("button", { name: "삭제" }).click();

  // Note disappears before server responds
  await expect(note).not.toBeVisible({ timeout: 2000 });

  // Unblock server
  deleteResolve?.();
});
