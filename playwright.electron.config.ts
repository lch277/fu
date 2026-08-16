import { defineConfig } from "@playwright/test";

// 独立于默认 e2e：Electron smoke 需要先构建静态导出产物（npm run build:electron），
// 且不依赖 dev server。运行：npm run test:electron
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  testMatch: /electron-smoke\.spec\.ts/,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "Electron",
      use: { channel: "msedge" },
    },
  ],
});
