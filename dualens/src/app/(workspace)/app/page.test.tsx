import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppPage from "@/app/(workspace)/app/page";
import { RootProviders } from "@/app/providers";
import { AppShell } from "@/components/layout/app-shell";
import { APP_LANGUAGE_STORAGE_KEY } from "@/lib/app-preferences";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/app")
}));

async function renderAppPage(searchParams: { lang?: string }) {
  const page = await AppPage({ searchParams: Promise.resolve(searchParams) });

  render(
    <RootProviders>
      <AppShell>{page}</AppShell>
    </RootProviders>
  );
}

describe("app route", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          configured: false,
          stargazersCount: null,
          formattedStars: "--",
          stale: false
        }),
        { status: 200 }
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
  });

  it("renders the worktree debate page structure in Chinese when opened from the Chinese landing page", async () => {
    await renderAppPage({ lang: "zh-CN" });

    expect(screen.getByRole("heading", { level: 1, name: "辩论" })).toBeInTheDocument();
    expect(screen.getByText("围绕同一问题确认双方立场与风格后，直接启动正式的双智能体辩论流程。")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "两仪决" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "EN" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /外观/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Star on GitHub/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("ink-landscape-background")).toHaveAttribute("data-variant", "workspace");
    expect(document.querySelectorAll('[data-shan-shui-strip="workspace"]')).toHaveLength(2);
    expect(screen.getByLabelText("决策问题")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始辩论" })).toBeInTheDocument();
  });

  it("renders the worktree debate page structure in English when opened from the English landing page", async () => {
    await renderAppPage({ lang: "en" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Debate" })).toBeInTheDocument();
    });
    expect(screen.getByText("Frame the decision question and confirm both roles before launching a structured dual-agent debate.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Dualens" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Decision question")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start debate" })).toBeInTheDocument();
    expect(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe("en");
  });

  it("keeps /app language driven by stored preferences without local topbar switches", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    await renderAppPage({});

    expect(screen.getByLabelText("Decision question")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start debate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "EN" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /外观/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Star on GitHub/ })).not.toBeInTheDocument();
  });
});
