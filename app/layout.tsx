import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  return {
    metadataBase,
    title: "神州大富翁｜掷出你的财富传奇",
    description: "高清手办风的本地多人经营游戏：买地产、炒股票、用卡片，与好友或 AI 环游神州。",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "神州大富翁",
      description: "掷出你的财富传奇",
      images: [{ url: new URL("/og.png", metadataBase).toString(), width: 1733, height: 909, alt: "神州大富翁游戏棋盘" }],
    },
    twitter: { card: "summary_large_image", title: "神州大富翁", description: "掷出你的财富传奇", images: [new URL("/og.png", metadataBase).toString()] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
