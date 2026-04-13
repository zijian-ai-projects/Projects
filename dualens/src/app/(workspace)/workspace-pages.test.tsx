import "@testing-library/jest-dom/vitest";

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/history"),
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}));

import HistoryPage from "@/app/(workspace)/history/page";
import ProvidersPage from "@/app/(workspace)/providers/page";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";
import SettingsPage from "@/app/(workspace)/settings/page";
import { RootProviders } from "@/app/providers";
import { AppShell } from "@/components/layout/app-shell";

function renderWorkspacePage(page: ReactNode) {
  render(
    <RootProviders>
      <AppShell>{page}</AppShell>
    </RootProviders>
  );
}

describe("workspace pages", () => {
  it.each([
    ["history", <HistoryPage key="history" />],
    ["providers", <ProvidersPage key="providers" />],
    ["search engines", <SearchEnginesPage key="search-engines" />],
    ["settings", <SettingsPage key="settings" />]
  ])("renders the shared shan-shui background behind the %s workspace page", async (name, page) => {
    renderWorkspacePage(page);

    expect(screen.getByTestId("ink-landscape-background")).toHaveAttribute("data-variant", "workspace");
    expect(document.querySelectorAll('[data-shan-shui-strip="workspace"]')).toHaveLength(2);
    if (name === "history") {
      expect(await screen.findByLabelText("搜索历史")).toBeInTheDocument();
    } else if (name === "settings") {
      expect(await screen.findByTestId("current-history-folder-row")).toBeInTheDocument();
    }
  });

  it("restores the history page", async () => {
    renderWorkspacePage(<HistoryPage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论历史" })).toBeInTheDocument();
    expect(await screen.findByLabelText("搜索历史")).toBeInTheDocument();
  });

  it("restores the model provider page", () => {
    renderWorkspacePage(<ProvidersPage />);

    expect(screen.getByRole("heading", { level: 1, name: "AI 服务商" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "AI 服务商" })).toBeInTheDocument();
  });

  it("restores the search engine configuration page", () => {
    renderWorkspacePage(<SearchEnginesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "搜索引擎" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "搜索引擎" })).toBeInTheDocument();
  });

  it("restores the settings page with the worktree language switch", async () => {
    renderWorkspacePage(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "通用设置" })).toBeInTheDocument();
    expect(screen.getByText("语言设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中文" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByText("辩论历史保存文件夹")).toBeInTheDocument();
    expect(await screen.findByTestId("current-history-folder-row")).toBeInTheDocument();
  });
});
