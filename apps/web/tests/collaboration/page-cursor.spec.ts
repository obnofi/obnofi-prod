import { test, expect } from "@playwright/test";
import {
  getUserId,
  signInAs,
  getWorkspaceId,
  createCollabPage,
} from "./helpers";

test("page presence: sidebar avatar appears for co-present user, disappears on disconnect", async ({
  browser,
}) => {
  test.setTimeout(60000);

  const contextA = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageA = await contextA.newPage();
  const workspaceId = await getWorkspaceId(pageA, "dev1");
  const userAId = getUserId("dev1");

  // Ensure dev2 user exists in DB before adding as collaborator
  const contextB = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageB = await contextB.newPage();
  await signInAs(pageB, "dev2");

  const { id: testPageId } = await createCollabPage(
    pageA,
    workspaceId,
    "document",
    `Cursor Test ${Date.now()}`,
    ["dev2"]
  );

  await pageA.goto(`/workspace/${workspaceId}?page=${testPageId}`);
  await pageA.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });

  await pageB.goto(`/workspace/${workspaceId}?page=${testPageId}`);
  await pageB.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });

  try {
    // userA avatar should appear in userB's sidebar next to the shared page
    await expect
      .poll(
        () =>
          pageB
            .locator(
              `[data-testid="sidebar-page-${testPageId}"] [data-testid="user-avatar-${userAId}"]`
            )
            .count(),
        { timeout: 8000, message: `user-avatar-${userAId} inside sidebar-page-${testPageId}` }
      )
      .toBeGreaterThan(0);

    // userA creates a second page and navigates there; awareness for testPageId clears
    const { id: secondPageId } = await createCollabPage(
      pageA,
      workspaceId,
      "document",
      `Second Page ${Date.now()}`
    );
    await pageA.goto(`/workspace/${workspaceId}?page=${secondPageId}`);

    // userB's sidebar: userA avatar should no longer be on the original page
    await expect
      .poll(
        () =>
          pageB
            .locator(
              `[data-testid="sidebar-page-${testPageId}"] [data-testid="user-avatar-${userAId}"]`
            )
            .count(),
        { timeout: 5000, message: "userA avatar should be gone from testPageId after navigation" }
      )
      .toBe(0);

    // Force-close userA context; avatar should fully disappear
    await contextA.close();

    await expect
      .poll(
        () => pageB.locator(`[data-testid="user-avatar-${userAId}"]`).count(),
        { timeout: 5000, message: "userA avatar should disappear after context close" }
      )
      .toBe(0);
  } finally {
    await contextB.close();
  }
});

test("document cursor: userA mouse movement shows figjam-like pointer in userB view", async ({
  browser,
}) => {
  test.setTimeout(60000);

  const contextA = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageA = await contextA.newPage();
  const workspaceId = await getWorkspaceId(pageA, "dev1");
  const userAId = getUserId("dev1");

  const contextB = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageB = await contextB.newPage();
  await signInAs(pageB, "dev2");

  const { id: docPageId } = await createCollabPage(
    pageA,
    workspaceId,
    "document",
    `Document Cursor Test ${Date.now()}`,
    ["dev2"]
  );

  await pageA.goto(`/workspace/${workspaceId}?page=${docPageId}`);
  await pageA.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });

  await pageB.goto(`/workspace/${workspaceId}?page=${docPageId}`);
  await pageB.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });

  try {
    const editorBox = await pageA.getByTestId("workspace-editor").boundingBox();
    if (!editorBox) throw new Error("Editor bounding box not found");

    await pageA.mouse.move(editorBox.x + editorBox.width / 3, editorBox.y + 80);
    await pageA.mouse.move(editorBox.x + editorBox.width / 2, editorBox.y + 140);

    await expect
      .poll(
        () => pageB.locator(`[data-user-cursor="${userAId}"]`).count(),
        { timeout: 8000, message: `data-user-cursor="${userAId}" should appear in userB's editor` }
      )
      .toBeGreaterThan(0);

    const boxBefore = await pageB.locator(`[data-user-cursor="${userAId}"]`).boundingBox();
    if (!boxBefore) throw new Error("Remote document cursor bounding box not found");

    await pageA.mouse.move(editorBox.x + editorBox.width - 120, editorBox.y + 240);

    await expect
      .poll(
        async () => {
          const box = await pageB.locator(`[data-user-cursor="${userAId}"]`).boundingBox();
          if (!box) return false;
          return Math.abs(box.x - boxBefore.x) > 5 || Math.abs(box.y - boxBefore.y) > 5;
        },
        { timeout: 5000, message: "Document cursor position should change after userA mouse move" }
      )
      .toBe(true);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
