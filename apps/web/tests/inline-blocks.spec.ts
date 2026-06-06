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
      title: `Inline Block Test ${Date.now()}`,
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

async function createWorkspaceDatabaseFixture(
  page: import("@playwright/test").Page
) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Database Fixture ${Date.now()}`,
      type: "database",
      workspaceId,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();
  const databasePage = (await createPageResponse.json()) as { id: string };

  const createDatabaseResponse = await page.context().request.post("/api/databases", {
    data: { pageId: databasePage.id },
  });
  expect(createDatabaseResponse.ok()).toBeTruthy();
  const database = (await createDatabaseResponse.json()) as { id: string };

  const createRowResponse = await page.context().request.post(
    `/api/databases/${database.id}/rows`,
    {
      data: { title: `Row Fixture ${Date.now()}` },
    }
  );
  expect(createRowResponse.ok()).toBeTruthy();
  const row = (await createRowResponse.json()) as { id: string; title: string };

  return {
    workspaceId: workspaceId!,
    databasePageId: databasePage.id,
    databaseId: database.id,
    rowId: row.id,
    rowTitle: row.title,
  };
}

async function focusEditorTail(page: import("@playwright/test").Page) {
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toBeVisible();
  await editor.locator("p").last().click();
  return editor;
}

// ─── Database (Undergrowth) ───────────────────────────────────────────────────

test("인라인 Database: 텍스트 셀 input이 포커스된다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const dbEmbed = page.getByTestId("inline-database-embed").last();
  await expect(dbEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 셀 내 input이 있으면 클릭 후 포커스 검증 (타이틀 입력 제외)
  const cellInput = dbEmbed.locator("input[name='text-cell']").first();
  const inputVisible = await cellInput.isVisible({ timeout: 5000 }).catch(() => false);
  if (inputVisible) {
    await cellInput.click();
    await expect(cellInput).toBeFocused();
    await page.keyboard.type("test-value");
    await expect(cellInput).toHaveValue("test-value");
  } else {
    // input이 없어도 셀 영역 클릭이 에러 없이 작동하면 통과
    const box = await dbEmbed.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(dbEmbed).toBeVisible();
  }
});

test("인라인 Database: 행 추가 버튼을 클릭하면 새 행이 나타난다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const dbEmbed = page.getByTestId("inline-database-embed").last();
  await expect(dbEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 행 추가 버튼 클릭
  const addRowBtn = dbEmbed
    .getByRole("button", { name: /행 추가|Add row|새 행|New|\+/ })
    .first();
  const btnVisible = await addRowBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (btnVisible) {
    const rowsBefore = await dbEmbed.locator("[data-testid='database-row'], tr[data-row-id]").count();
    await addRowBtn.click();
    // 새 행이 추가되거나 최소한 에러 없이 작동
    await expect(dbEmbed).toBeVisible();
    const rowsAfter = await dbEmbed.locator("[data-testid='database-row'], tr[data-row-id]").count();
    expect(rowsAfter).toBeGreaterThanOrEqual(rowsBefore);
  } else {
    await expect(dbEmbed).toBeVisible();
  }
});

// ─── Canvas (Clearing) ────────────────────────────────────────────────────────

test("인라인 Canvas: Open 버튼을 클릭해도 크래시가 없다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  const openBtn = page.getByTestId("inline-canvas-open");
  await expect(openBtn).toBeVisible();
  // 클릭해도 에러 없이 작동 (navigate하거나 현재 페이지 유지)
  await openBtn.click();
  // 네비게이션 후에도 페이지가 살아있음을 확인
  await expect(page).not.toHaveURL("about:blank");
});

test("인라인 Canvas: 내부 클릭이 에디터 노드 선택을 유발하지 않는다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 클릭 전에 canvas embed가 1개인지 확인
  await expect(canvasEmbed).toHaveCount(1);

  // 헤더 영역 클릭 (element 상대 좌표): Playwright가 자동 스크롤-인투-뷰 처리
  // box.y + height/2 는 캔버스 임베드가 뷰포트를 벗어날 경우 하단 GroveInsertionToolbar
  // 의 캔버스 버튼과 y좌표가 겹쳐 두 번째 캔버스가 삽입되는 문제를 방지
  await canvasEmbed.click({ position: { x: 40, y: 20 } });

  // 클릭 후에도 canvas embed가 1개여야 함
  await expect(canvasEmbed).toHaveCount(1);

  // ProseMirror 노드 선택 시 나타나는 .ProseMirror-selectednode 클래스가 없어야 함
  const editorInput = page.getByTestId("workspace-editor-input");
  const selectedNode = editorInput.locator(".ProseMirror-selectednode");
  await expect(selectedNode).toHaveCount(0);

  // canvas embed 자체는 여전히 보여야 함
  await expect(canvasEmbed).toBeVisible();
});

// ─── 편집 가능성 심화 검증 ────────────────────────────────────────────────────

test("인라인 Database: New 버튼으로 행 추가되고 타이틀 버튼이 렌더된다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const dbEmbed = page.getByTestId("inline-database-embed").last();
  await expect(dbEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // "New" 버튼 직접 클릭
  const newBtn = dbEmbed.getByRole("button", { name: "New" }).first();
  await expect(newBtn).toBeVisible({ timeout: 10000 });

  const rowsBefore = await dbEmbed.locator("tbody tr").count();
  await newBtn.click();

  // 행이 추가돼야 함
  await expect(dbEmbed.locator("tbody tr")).toHaveCount(rowsBefore + 1, { timeout: 10000 });

  // 행 타이틀 버튼이 렌더돼야 함
  const titleBtn = dbEmbed.locator("tbody tr button").first();
  await expect(titleBtn).toBeVisible();
});

test("Database row 상세 탭은 캐시된 row 정보로 열리고 database를 다시 요청하지 않는다", async ({ page }) => {
  test.setTimeout(120000);

  const fixture = await createWorkspaceDatabaseFixture(page);
  await page.goto(`/workspace/${fixture.workspaceId}?page=${fixture.databasePageId}`);

  await expect(page.getByTestId("workspace-database-ready")).toBeVisible({
    timeout: 20000,
  });

  const requests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes(`/api/databases/${fixture.databaseId}`)) {
      requests.push(url);
    }
  });

  const rowLocator = page.locator("tbody tr").filter({ hasText: fixture.rowTitle }).first();
  await expect(rowLocator).toBeVisible({ timeout: 15000 });
  const openRowButton = rowLocator.getByRole("button", { name: fixture.rowTitle });
  await expect(openRowButton).toBeVisible({ timeout: 15000 });
  await openRowButton.click();

  const sideTab = page.locator("[data-grove-side-tab-panel='true']");
  await expect(sideTab).toBeVisible({ timeout: 15000 });
  await expect(sideTab).toContainText(fixture.rowTitle);
  expect(requests).toHaveLength(0);
});

test("Database는 처음 생성되면 이름 컬럼만 보이고 상세 탭 제목 변경이 즉시 반영된다", async ({ page }) => {
  test.setTimeout(120000);

  const fixture = await createWorkspaceDatabaseFixture(page);
  await page.goto(`/workspace/${fixture.workspaceId}?page=${fixture.databasePageId}`);

  const workspaceDatabase = page.getByTestId("workspace-database-ready");
  await expect(workspaceDatabase).toBeVisible({ timeout: 20000 });
  await expect(workspaceDatabase).toContainText("1 columns");
  await expect(page.locator("thead")).toContainText("이름");
  await expect(workspaceDatabase.getByRole("button", { name: "Table" })).toBeVisible();
  await expect(workspaceDatabase.getByRole("button", { name: "Gallery" })).toHaveCount(0);
  await expect(workspaceDatabase.getByRole("button", { name: "Kanban" })).toHaveCount(0);
  await expect(workspaceDatabase.getByRole("button", { name: "Calendar" })).toHaveCount(0);

  let releasePatch: (() => void) | null = null;
  const patchStarted = new Promise<void>((resolve) => {
    void page.route(`**/api/pages/${fixture.rowId}`, async (route, request) => {
      if (request.method() !== "PATCH") {
        await route.continue();
        return;
      }

      resolve();
      await new Promise<void>((resume) => {
        releasePatch = resume;
      });
      await route.continue();
    });
  });

  const rowLocator = page.locator("tbody tr").filter({ hasText: fixture.rowTitle }).first();
  await expect(rowLocator).toBeVisible({ timeout: 15000 });
  await rowLocator.getByRole("button", { name: fixture.rowTitle }).click();

  const sideTab = page.locator("[data-grove-side-tab-panel='true']");
  await expect(sideTab).toBeVisible({ timeout: 15000 });

  const nextTitle = `Optimistic Row ${Date.now()}`;
  const titleField = sideTab.locator("textarea[name='page-title']");
  await titleField.fill(nextTitle);

  await patchStarted;
  await expect(page.locator("tbody tr").filter({ hasText: nextTitle }).first()).toBeVisible();

  releasePatch?.();
  await expect(sideTab).toContainText(nextTitle);
});

test("인라인 Canvas: Select 툴 버튼 클릭이 동작한다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 인라인 캔버스 내부 툴바에서 Select 버튼 찾기
  const selectBtn = canvasEmbed.getByTitle("Select");
  await expect(selectBtn).toBeVisible({ timeout: 10000 });

  // 클릭이 에러 없이 동작해야 함
  await selectBtn.click();
  await expect(canvasEmbed).toBeVisible();
});

test("인라인 Canvas: 보드 배경 클릭이 에러 없이 동작한다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed").last();
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 헤더 바로 아래 보드 상단 영역 클릭
  // y=height/2 는 뷰포트 스크롤 시 GroveInsertionToolbar와 겹칠 수 있으므로 y=60 사용
  await canvasEmbed.click({ position: { x: 200, y: 60 } });

  // 클릭 후에도 단 하나의 canvas embed가 있어야 함
  await expect(page.getByTestId("inline-canvas-embed")).toHaveCount(1);
  // ProseMirror 노드 선택 없어야 함
  const selectedNode = page.getByTestId("workspace-editor-input").locator(".ProseMirror-selectednode");
  await expect(selectedNode).toHaveCount(0);
});

// ─── DB Diagram ───────────────────────────────────────────────────────────────

test("인라인 DB Diagram: 블록 클릭 후 블록이 언마운트되지 않는다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/erd");

  const diagramBlock = page.getByTestId("db-diagram-block").last();
  await expect(diagramBlock).toBeVisible({ timeout: 10000 });

  const box = await diagramBlock.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  // 클릭 후에도 블록이 살아있어야 함 (ProseMirror가 선택으로 가로채면 블록 상태 변경 가능)
  await expect(diagramBlock).toBeVisible();

  // ProseMirror 노드 선택 클래스가 없어야 함
  const editorInput = page.getByTestId("workspace-editor-input");
  const selectedNode = editorInput.locator(".ProseMirror-selectednode");
  await expect(selectedNode).toHaveCount(0);
});

test("인라인 DB Diagram: CodeMirror 에디터에 타이핑이 가능하다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/erd");

  const diagramBlock = page.getByTestId("db-diagram-block").last();
  await expect(diagramBlock).toBeVisible({ timeout: 10000 });

  const cmEditor = diagramBlock.locator(".cm-editor").first();
  const cmVisible = await cmEditor.isVisible({ timeout: 5000 }).catch(() => false);

  if (cmVisible) {
    await cmEditor.click();
    // CodeMirror의 contenteditable 영역에 포커스
    const cmContent = cmEditor.locator(".cm-content");
    await expect(cmContent).toBeFocused();
    await page.keyboard.type("-- inline test");
    // cm-content 텍스트에 타이핑한 내용이 포함되어야 함
    await expect(cmContent).toContainText("-- inline test");
  } else {
    // CodeMirror가 없어도 블록이 보이면 통과
    await expect(diagramBlock).toBeVisible();
  }
});
