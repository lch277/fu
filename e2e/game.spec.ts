import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("从宽屏首页开局、掷骰并恢复自动存档", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  await expect(page.getByRole("heading", { name: "神州大富翁" })).toBeVisible();
  await page.getByRole("button", { name: "将阿土伯切换为真人" }).click();
  await page.getByRole("button", { name: "开始掷骰" }).click();

  await expect(page.getByLabel("神州环游棋盘")).toBeVisible();
  await expect(page.getByRole("button", { name: "掷骰", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "掷骰", exact: true }).click();
  await expect(page.locator(".map-center-die span")).not.toHaveText("?");
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("richman-web:v1:auto")))).toBe(true);

  await page.reload();
  await page.getByRole("button", { name: "继续上次对局" }).click();
  await expect(page.getByLabel("神州环游棋盘")).toBeVisible();
  expect(errors).toEqual([]);
});

test("桌面棋盘优先占据主视区且设置可操作", async ({ page }) => {
  await page.getByRole("button", { name: "开始掷骰" }).click();
  const board = await page.locator(".board-shell").boundingBox();
  const rail = await page.getByLabel("玩家排行").boundingBox();
  expect(board).not.toBeNull();
  expect(rail).not.toBeNull();
  expect(board!.width).toBeGreaterThan(rail!.width * 2);
  expect(board!.x).toBeLessThan(rail!.x);

  await page.getByRole("button", { name: "游戏设置" }).click();
  await page.getByRole("button", { name: "2 倍速" }).click();
  await expect(page.getByRole("button", { name: "2 倍速" })).toHaveClass(/active/);
  await expect(page.getByRole("button", { name: "关闭音效" })).toBeVisible();
});
