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

async function gotoCollaborativeDocument(page: Page) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Collab Page ${Date.now()}`,
      type: "document",
      workspaceId,
      collaborationEnabled: true,
      lineIndicatorEnabled: true,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "shared grove seed" }],
          },
        ],
      },
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();
  const createdPage = (await createPageResponse.json()) as { id: string };

  await page.context().request.patch(`/api/pages/${createdPage.id}`, {
    data: {
      collaborationEnabled: true,
      lineIndicatorEnabled: true,
    },
  });

  await page.goto(`/workspace/${workspaceId}?page=${createdPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible();

  return { workspaceId, pageId: createdPage.id };
}

async function focusEditor(page: Page) {
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toBeVisible();
  await editor.locator("p").last().click();
  return editor;
}

test("공유편집에서 실시간 커서와 편집 상태가 보인다", async ({ browser }) => {
  test.setTimeout(120000);

  const primaryContext = await browser.newContext({
    baseURL: "http://localhost:3000",
  });
  const page = await primaryContext.newPage();
  const { workspaceId, pageId } = await gotoCollaborativeDocument(page);

  const secondContext = await browser.newContext({
    baseURL: "http://localhost:3000",
  });
  const peerPage = await secondContext.newPage();

  try {
    await signInAsDeveloper(peerPage);
    await peerPage.goto(`/workspace/${workspaceId}?page=${pageId}`);
    await expect(peerPage.getByTestId("workspace-editor")).toBeVisible();

    const peerEditor = await focusEditor(peerPage);
    await page.bringToFront();

    await expect(page.getByTestId("collaboration-status")).toBeVisible();

    await expect
      .poll(async () => page.locator(".collaboration-cursor__caret").count())
      .toBeGreaterThan(0);

    await expect
      .poll(async () => page.locator(".line-presence-block").count())
      .toBeGreaterThan(0);

    await peerEditor.press("End");
    await peerPage.keyboard.type(" live cursor");

    await expect(page.getByTestId("workspace-editor-input")).toContainText(
      "shared grove seed live cursor"
    );
  } finally {
    await primaryContext.close();
    await secondContext.close();
  }
});
