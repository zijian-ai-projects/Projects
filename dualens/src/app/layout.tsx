import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProviders } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "两仪决 | 一个问题，两种视角，证据始终可见",
  description: "两仪决是面向复杂判断的双视角证据辩论工作台。"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = window.localStorage.getItem("dualens:theme-mode");
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const resolved = mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themeMode = "system";
    document.documentElement.style.colorScheme = "light";
  }
})();`
          }}
        />
      </head>
      <body>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
