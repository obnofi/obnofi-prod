import { test, expect } from "@playwright/test";

const editorText = `playwright-note-${Date.now()}`;
const nextTitle = `Playwright Title ${Date.now()}`;

async function signInAsDeveloper(page: import("@playwright/test").Page) {
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

async function gotoWorkspaceDocument(
  page: import("@playwright/test").Page,
  content: object = { type: "doc", content: [{ type: "paragraph" }] }
) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId =
    page.url().match(/\/workspace\/([^/?]+)/)?.[1];

  expect(workspaceId).toBeTruthy();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Playwright Page ${Date.now()}`,
      type: "document",
      workspaceId,
      content,
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();

  const createdPage = (await createPageResponse.json()) as { id: string };
  await page.goto(`/workspace/${workspaceId}?page=${createdPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible();
}

async function focusEditorTail(page: import("@playwright/test").Page) {
  const editor = page.getByTestId("workspace-editor-input");
  const lastParagraph = editor.locator("p").last();

  await expect(editor).toBeVisible();
  await expect(lastParagraph).toBeVisible();
  await lastParagraph.click();

  return editor;
}

test("Tiptap 블록 에디터 기본 동작", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type(editorText);

  await expect(editor).toContainText(editorText);
});

test("[ ] 입력시 체크박스 할일 블록이 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type("[ ] 할 일");
  await page.keyboard.press("Space");

  const taskItem = editor.locator('li[data-type="taskItem"]').last();
  const checkbox = taskItem.locator('input[type="checkbox"]').first();

  await expect(taskItem).toBeVisible();
  await expect(taskItem).toContainText("할 일");
  await expect(checkbox).not.toBeChecked();
});

test("워크스페이스 진입 후 에디터가 표시된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await expect(page.getByTestId("workspace-editor")).toBeVisible();
  await expect(page.getByTestId("workspace-editor-input")).toBeVisible();
  await expect(page.getByTestId("workspace-page-title")).toHaveValue(/.+/);
});

test("문서 제목을 수정할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const titleInput = page.getByTestId("workspace-page-title");
  await titleInput.fill(nextTitle);

  await expect(titleInput).toHaveValue(nextTitle);
  await expect(page.getByTestId("workspace-sidebar")).toContainText(nextTitle);
});

test("목차 항목을 클릭하면 해당 Grove 제목으로 이동한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const fillerParagraphs = Array.from({ length: 80 }, (_, index) => ({
    type: "paragraph",
    content: [{ type: "text", text: `Grove filler line ${index + 1}` }],
  }));

  await gotoWorkspaceDocument(page, {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Canopy Start" }] },
      ...fillerParagraphs,
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Deep Grove Section" }] },
      { type: "paragraph", content: [{ type: "text", text: "Arrived at the section." }] },
    ],
  });

  const targetHeading = page.getByRole("heading", { name: "Deep Grove Section" });
  const tocButton = page.getByRole("button", { name: "Deep Grove Section" });

  await expect(tocButton).toBeVisible();

  const beforeScrollTop = await page.evaluate(() => {
    const surface = document.querySelector('[data-testid="grove-page-surface"]');
    return Math.max(
      surface instanceof HTMLElement ? surface.scrollTop : 0,
      window.scrollY
    );
  });
  await tocButton.click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const surface = document.querySelector('[data-testid="grove-page-surface"]');
        return Math.max(
          surface instanceof HTMLElement ? surface.scrollTop : 0,
          window.scrollY
        );
      })
    )
    .toBeGreaterThan(beforeScrollTop);

  const targetTop = await targetHeading.evaluate(
    (heading) => heading.getBoundingClientRect().top
  );

  expect(targetTop).toBeGreaterThanOrEqual(0);
  expect(targetTop).toBeLessThan(280);
});

test("/canvas 입력시 인라인 캔버스가 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready");
  await expect(page.getByTestId("inline-canvas-ready")).toBeVisible();
  await expect(page.getByTestId("inline-canvas-open")).toBeVisible();
  await expect(page.getByTestId("inline-canvas")).toBeVisible();
});

test("/image 입력시 이미지 블록을 추가하고 파일 업로드를 반영한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/image");

  const imageBlock = page.getByTestId("grove-image-block").last();
  await expect(imageBlock).toBeVisible();

  const fileInput = imageBlock.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "grove-seed.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM9sAAAAASUVORK5CYII=",
      "base64"
    ),
  });

  await expect(imageBlock.locator("img")).toHaveAttribute("src", /^(data:|blob:|https?:)/);
});

test("새로고침 시 legacy 인라인 캔버스 블록이 무한 재요청하지 않는다", async ({ page }) => {
  test.setTimeout(90000);
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId =
    page.url().match(/\/workspace\/([^/?]+)/)?.[1];

  expect(workspaceId).toBeTruthy();

  const parentPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Canvas Parent ${Date.now()}`,
      type: "document",
      workspaceId,
      content: {
        type: "doc",
        content: [
          {
            type: "canvasEmbed",
            attrs: {
              pageId: null,
              workspaceId,
              parentPageId: "legacy-parent-placeholder",
              autoCreate: false,
            },
          },
        ],
      },
    },
  });

  expect(parentPageResponse.ok()).toBeTruthy();

  const parentPage = (await parentPageResponse.json()) as { id: string };

  const patchedParentResponse = await page.context().request.patch(
    `/api/pages/${parentPage.id}`,
    {
      data: {
        content: {
          type: "doc",
          content: [
            {
              type: "canvasEmbed",
              attrs: {
                pageId: null,
                workspaceId,
                parentPageId: parentPage.id,
                autoCreate: false,
              },
            },
          ],
        },
      },
    }
  );

  expect(patchedParentResponse.ok()).toBeTruthy();

  let workspacePageListRequests = 0;
  await page.route(`**/api/pages?workspaceId=${workspaceId}`, async (route) => {
    workspacePageListRequests += 1;
    await route.continue();
  });

  await page.goto(`/workspace/${workspaceId}?page=${parentPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("inline-canvas-collapsed")).toBeVisible({ timeout: 10000 });
  await page.reload();
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("inline-canvas-collapsed")).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2500);

  expect(workspacePageListRequests).toBeLessThanOrEqual(2);
});

test("/database 입력시 인라인 데이터베이스가 삽입된다", async ({ page }) => {
  test.setTimeout(60000);
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const databaseEmbed = page.getByTestId("inline-database-embed").last();
  await expect(databaseEmbed).toHaveAttribute("data-state", "ready", { timeout: 20000 });
  await expect(page.getByTestId("inline-database-open").last()).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("inline-database-ready").last()).toBeVisible({ timeout: 20000 });
});

test("/github 입력시 GitHub 임베드 블록이 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/github");
  await page.keyboard.press("Enter");

  const githubEmbed = page.getByTestId("github-embed-block").last();
  await expect(githubEmbed).toBeVisible();

  await githubEmbed
    .getByLabel("GitHub URL")
    .fill("https://github.com/openai/codex/pull/1");
  await githubEmbed.getByRole("button", { name: "임베드" }).click();

  await expect(githubEmbed.getByRole("link")).toHaveAttribute(
    "href",
    "https://github.com/openai/codex/pull/1"
  );
  await expect(githubEmbed).toContainText("Pull request #1");
  await expect(githubEmbed).toContainText("openai/codex#1");

  await githubEmbed.hover();
  const blockHandle = page.getByRole("button", { name: "블록 이동" });
  await expect(blockHandle).toBeVisible();
  const handleBox = await blockHandle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  // pointer simulation triggers selectBlockNode but loses editor focus — restore it
  await page.evaluate(() => {
    (document.querySelector(".ProseMirror") as HTMLElement)?.focus();
  });
  await page.keyboard.press("Backspace");
  await expect(githubEmbed).toBeHidden();
});

test("/button 입력시 버튼 블록이 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/button");
  await page.keyboard.press("Enter");

  const buttonBlock = page.getByTestId("button-block").last();
  await expect(buttonBlock).toBeVisible();
  await expect(page.getByTestId("button-block-preview").last()).toContainText("Button");
  await expect(page.getByTestId("button-block-label").last()).toHaveValue("Button");
  await expect(page.getByTestId("button-block-url").last()).toHaveValue("");
});

test(": 입력시 기본 이모지 탭에서 이모지를 삽입할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type(":seed");
  await page.keyboard.press("Enter");

  await expect(editor).toContainText("🌱");
});

test("이미지를 잘라 개인 이모지로 추가할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type(":");
  await page.locator('input[type="file"][accept="image/*"]:not([name])').setInputFiles({
    name: "grove.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHxcCA8uBbrQAAAAASUVORK5CYII=",
      "base64"
    ),
  });

  await page.getByPlaceholder("my-emoji").fill("grove");
  await page.getByRole("button", { name: "잘라서 추가" }).click();

  await expect(editor.locator('img[data-obnofi-custom-emoji][title=":grove:"]').last()).toBeVisible();
});

test("그래프 뷰에서도 사이드바가 유지된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await page.getByTestId("graph-view-link").click();

  await expect(page.getByTestId("workspace-graph-page")).toBeVisible();
  await expect(page.getByTestId("workspace-sidebar")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Graph View" })).toBeVisible();
  await expect(page.getByTestId("graph-back-link")).toBeVisible();
});

test("사이드바를 숨기고 다시 열 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const sidebar = page.getByTestId("workspace-sidebar");
  await expect(sidebar).toBeVisible();

  await page.getByRole("button", { name: "사이드바 숨기기" }).click();
  await expect(page.getByRole("button", { name: "사이드바 열기" })).toBeVisible();

  await page.getByRole("button", { name: "사이드바 열기" }).click();
  await expect(sidebar).toBeVisible();
});

test("사이드바 너비를 조절할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const sidebar = page.getByTestId("workspace-sidebar");
  const resizeHandle = page.getByRole("button", { name: "사이드바 너비 조절" });
  const beforeBox = await sidebar.boundingBox();
  const handleBox = await resizeHandle.boundingBox();

  expect(beforeBox).not.toBeNull();
  expect(handleBox).not.toBeNull();

  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + 80, handleBox!.y + handleBox!.height / 2, {
    steps: 8,
  });
  await page.mouse.up();

  const afterBox = await sidebar.boundingBox();
  expect(afterBox).not.toBeNull();
  expect(afterBox!.width).toBeGreaterThan(beforeBox!.width);
});

test("블록 핸들을 드래그해 블록 순서를 바꿀 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page, {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Welcome to Obnofi" }] },
      { type: "paragraph", content: [{ type: "text", text: "Features" }] },
    ],
  });

  const sourceBlock = page
    .locator("[data-grove-block='true']")
    .filter({ hasText: "Welcome to Obnofi" })
    .first();
  const targetBlock = page
    .locator("[data-grove-block='true']")
    .filter({ hasText: "Features" })
    .first();

  await expect(sourceBlock).toBeVisible();
  await expect(targetBlock).toBeVisible();

  await sourceBlock.hover();

  const moveHandle = page.getByRole("button", { name: "블록 이동" });
  await expect(moveHandle).toBeVisible();

  const handleBox = await moveHandle.boundingBox();
  const targetBox = await targetBlock.boundingBox();

  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + 4, targetBox!.y + targetBox!.height - 6, { steps: 12 });
  await page.mouse.up();

  const blockTexts = await page.locator("[data-grove-block='true']").evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
  );

  expect(blockTexts.indexOf("Welcome to Obnofi")).toBeGreaterThan(
    blockTexts.indexOf("Features")
  );
});
