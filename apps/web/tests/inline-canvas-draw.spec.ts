import { test, expect } from "@playwright/test";

async function signInAsDeveloper(page: import("@playwright/test").Page) {
  const request = page.context().request;
  const csrfResponse = await request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken, callbackUrl: "/workspace", json: "true" },
  });
}

async function gotoWorkspaceDocument(page: import("@playwright/test").Page) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);
  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();
  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Inline Canvas Draw ${Date.now()}`,
      type: "document",
      workspaceId,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    },
  });
  expect(createPageResponse.ok()).toBeTruthy();
  const createdPage = (await createPageResponse.json()) as { id: string };
  await page.goto(`/workspace/${workspaceId}?page=${createdPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
}

// 모든 도형(테두리 div)의 위치+크기 스냅샷
async function shapeRects(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".border-2.shadow-sm")).map((e) => {
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    })
  );
}

test("인라인 Canvas: 사각형을 드래그하면 드래그 크기대로 도형이 그려진다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);

  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toBeVisible();
  await editor.locator("p").last().click();
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed").last();
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });
  const board = page.getByTestId("inline-canvas");
  await expect(board).toBeVisible();
  await page.waitForTimeout(2000); // bootstrap(room) 완료 대기

  // 좌표 측정 전에 스크롤·툴 선택을 끝내 뷰포트를 고정한다
  await board.scrollIntoViewIfNeeded();
  await canvasEmbed.getByTitle("Rectangle").click();
  await page.waitForTimeout(300);
  const boardBox = (await board.boundingBox())!;

  // 툴바 영역 (하단 중앙) 좌표
  const toolbarBox = await canvasEmbed
    .locator("[class*='bottom-4']").first().boundingBox().catch(() => null);

  // 이미 존재하는 요소(데모 포함) + 툴바 회피 영역
  const occupied = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".cursor-grab.absolute")).map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    })
  );
  if (toolbarBox) occupied.push(toolbarBox);

  const dragW = 150;
  const dragH = 100;
  let start: { x: number; y: number } | null = null;
  for (let gy = 75; gy < boardBox.height - dragH - 100 && !start; gy += 22) {
    for (let gx = 40; gx < boardBox.width - dragW - 40; gx += 30) {
      const sx = boardBox.x + gx;
      const sy = boardBox.y + gy;
      const hit = occupied.some(
        (o) => sx < o.x + o.w + 24 && sx + dragW > o.x - 24 && sy < o.y + o.h + 24 && sy + dragH > o.y - 24
      );
      if (!hit) { start = { x: sx, y: sy }; break; }
    }
  }
  expect(start, "빈 보드 지점을 찾지 못함").not.toBeNull();

  const before = await shapeRects(page);

  await page.mouse.move(start!.x, start!.y);
  await page.mouse.down();
  await page.mouse.move(start!.x + dragW, start!.y + dragH, { steps: 12 });
  await page.mouse.up();

  // 새로 추가된 도형(이전 스냅샷에 없던 것)을 찾아 크기 검증.
  // canvasEmbed 노드가 draggable이면 드래그가 native drag로 가로채여 pointercancel이
  // 발생, 도형이 초기 크기(≈1×1)로 멈춘다. 이 단언이 그 회귀를 막는다.
  let drawn: { x: number; y: number; w: number; h: number } | undefined;
  await expect
    .poll(
      async () => {
        const now = await shapeRects(page);
        drawn = now.find(
          (r) =>
            !before.some((b) => Math.abs(b.x - r.x) < 4 && Math.abs(b.y - r.y) < 4 && Math.abs(b.w - r.w) < 4) &&
            Math.abs(r.x - start!.x) < dragW + 30 &&
            Math.abs(r.y - start!.y) < dragH + 30
        );
        return drawn ? drawn.w : 0;
      },
      { timeout: 5000 }
    )
    .toBeGreaterThan(10);

  // 드래그 크기와 ±30px 이내로 일치해야 함 (pointermove가 끝까지 추적됨)
  expect(Math.abs(drawn!.w - dragW)).toBeLessThan(30);
  expect(Math.abs(drawn!.h - dragH)).toBeLessThan(30);
});
