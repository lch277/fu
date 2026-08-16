import type { NextConfig } from "next";

// ELECTRON_BUILD=1 时做静态导出，供 Electron 直接 loadFile 加载；
// 普通构建保持原行为，供 Cloudflare/vinext 部署使用。
const nextConfig: NextConfig = {
  ...(process.env.ELECTRON_BUILD === "1" ? { output: "export" } : {}),
};

export default nextConfig;
