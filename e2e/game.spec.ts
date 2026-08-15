import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("从宽屏首页开局、掷骰并恢复自动存档", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  // 首页已精简为设置面板(标题区移除),以设置卡片可见性作为首页就绪标志
  await expect(page.getByLabel("新游戏设置")).toBeVisible();
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
  const feed = await page.getByLabel("事件记录").boundingBox();
  expect(board).not.toBeNull();
  expect(rail).not.toBeNull();
  expect(feed).not.toBeNull();
  expect(board!.width).toBeGreaterThan(feed!.width * 2);
  expect(rail!.y + rail!.height).toBeLessThanOrEqual(board!.y + 4);
  expect(board!.x + board!.width).toBeLessThanOrEqual(feed!.x + 4);

  await page.getByRole("button", { name: "游戏设置" }).click();
  await page.getByRole("button", { name: "2 倍速" }).click();
  await expect(page.getByRole("button", { name: "2 倍速" })).toHaveClass(/active/);
  await expect(page.getByRole("button", { name: "关闭音效" })).toBeVisible();
});
