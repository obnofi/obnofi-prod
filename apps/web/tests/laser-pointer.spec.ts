import { test, expect } from "@playwright/test";

const LASER_SELECTOR = 'circle[fill="#ff2b2b"]';

async function signInAsDeveloper(page: import("@playwright/test").Page) {
  const request = page.context().request;
  const csrfResponse = await request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken, callbackUrl: "/workspace", json: "true" },
  });
}

async function createDocument(page: import("@playwright/test").Page) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);
  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();
  const res = await page.context().request.post("/api/pages", {
    data: {
      title: `Laser ${Date.now()}`,
      type: "document",
      workspaceId,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    },
  });
  expect(res.ok()).toBeTruthy();
  const created = (await res.json()) as { id: string };
  await page.goto(`/workspace/${workspaceId}?page=${created.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
}

async function shake(page: import("@playwright/test").Page, cx: number, cy: number) {
  await page.mouse.move(cx, cy);
  for (let i = 0; i < 10; i += 1) {
    await page.mouse.move(cx + (i % 2 === 0 ? 60 : -60), cy);
  }
}

test("기본 문서 페이지: R 누른 채 흔들면 레이저가 표시되고 5초 후 사라진다", async ({ page }) => {
  test.setTimeout(120000);
  await createDocument(page);

  const shell = page.getByTestId("workspace-editor");
  const box = (await shell.boundingBox())!;
  // 에디터 포커스 해제 (contenteditable에서는 R이 무시됨)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await page.keyboard.down("r");
  await shake(page, box.x + box.width / 2, box.y + box.height / 2);

  await expect(page.locator(LASER_SELECTOR).first()).toBeVisible({ timeout: 3000 });
  await page.keyboard.up("r");

  // 마지막 움직임 후 5초 → 사라짐
  await page.waitForTimeout(6000);
  await expect(page.locator(LASER_SELECTOR)).toHaveCount(0);
});

test("문서 toolbar: 레이저 버튼 누르고 움직이면 레이저가 표시된다", async ({ page }) => {
  test.setTimeout(120000);
  await createDocument(page);

  const shell = page.getByTestId("workspace-editor");
  const box = (await shell.boundingBox())!;

  await page.getByTestId("toolbar-laser").click();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 20);

  await expect(page.locator(LASER_SELECTOR).first()).toBeVisible({ timeout: 3000 });
});

test("Clearing 캔버스: 레이저 툴 버튼 누르고 움직이면 레이저가 표시된다", async ({ page }) => {
  test.setTimeout(120000);
  await createDocument(page);

  // 인라인 캔버스 삽입
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toBeVisible();
  await editor.locator("p").last().click();
  await page.keyboard.type("/canvas");
  const canvasEmbed = page.getByTestId("inline-canvas-embed").last();
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });
  const board = page.getByTestId("inline-canvas");
  await expect(board).toBeVisible();
  await page.waitForTimeout(2000);
  const box = (await board.boundingBox())!;

  // laser 툴 버튼 클릭
  await page.locator('button[title="Laser pointer (hold R + shake)"]').click();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20);
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2);

  await expect(page.locator(LASER_SELECTOR).first()).toBeVisible({ timeout: 3000 });
});
