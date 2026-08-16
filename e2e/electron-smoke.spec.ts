import { _electron as electron, expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Electron 便携版应用可渲染棋盘并开局", async () => {
  const errors: string[] = [];
  const app = await electron.launch({ args: ["."], cwd: projectRoot });
  const window = await app.firstWindow();
  window.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  window.on("pageerror", (e) => errors.push(String(e)));

  await expect(window.getByLabel("新游戏设置")).toBeVisible();
  await window.getByRole("button", { name: "开始掷骰" }).click();
  await expect(window.getByLabel("神州环游棋盘")).toBeVisible();
  await expect(window.getByRole("button", { name: "掷骰", exact: true })).toBeVisible();

  expect(errors).toEqual([]);
  await app.close();
});
