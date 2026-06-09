import { test, expect, type Page } from "@playwright/test";

async function signInAsDeveloper(page: Page) {
  const request = page.context().request;
  const csrfResponse = await request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken, callbackUrl: "/workspace", json: "true" },
  });
}

async function createPage(
  page: Page,
  workspaceId: string,
  title: string,
  parentId?: string,
  content?: object
) {
  const response = await page.context().request.post("/api/pages", {
    data: {
      title,
      type: "document",
      workspaceId,
      ...(parentId ? { parentId } : {}),
      content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { id: string };
}

test("그래프 뷰 — 데이터 로딩 및 인터랙션", async ({ page }) => {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();

  const stamp = Date.now();
  // 부모-자식 관계 → 그래프 계층(hierarchy) 엣지가 생긴다.
  const parent = await createPage(page, workspaceId!, `Graph Parent ${stamp}`);
  await createPage(page, workspaceId!, `Graph Child ${stamp}`, parent.id);

  await page.goto(`/workspace/${workspaceId}/graph`);
  await expect(page.getByTestId("workspace-graph-page")).toBeVisible({
    timeout: 15000,
  });

  // 데이터 로딩 성공 → 에러 메시지가 아니라 노드가 렌더된다.
  const nodes = page.locator(".react-flow__node");
  await expect(nodes.first()).toBeVisible({ timeout: 15000 });
  expect(await nodes.count()).toBeGreaterThanOrEqual(2);

  // 계층 엣지 1개 이상.
  await expect(page.locator(".react-flow__edge").first()).toBeVisible({
    timeout: 15000,
  });

  // 설정 패널 + 검색 인터랙션.
  const search = page.getByPlaceholder("노드 검색…");
  await expect(search).toBeVisible();
  await search.fill(`Graph Parent ${stamp}`);
  // 검색해도 그래프는 유지되어야 한다 (크래시 없음).
  await expect(nodes.first()).toBeVisible();
});
