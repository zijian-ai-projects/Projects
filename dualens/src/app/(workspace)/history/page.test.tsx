import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HistoryPage from "@/app/(workspace)/history/page";
import { APP_LANGUAGE_STORAGE_KEY, AppPreferencesProvider } from "@/lib/app-preferences";

function renderHistoryPage() {
  render(
    <AppPreferencesProvider>
      <HistoryPage />
    </AppPreferencesProvider>
  );
}

describe("HistoryPage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders searchable history cards and the renamed history page title", () => {
    renderHistoryPage();

    expect(screen.getByRole("heading", { level: 1, name: "辩论历史" })).toBeInTheDocument();
    expect(screen.getByLabelText("搜索历史")).toBeInTheDocument();
    expect(screen.getByText("是否应该在今年转去独立开发？")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "查看详情" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "重新发起同题辩论" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "删除" }).length).toBeGreaterThan(0);
  });

  it("uses the stored English global language for page chrome", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Debate history" })).toBeInTheDocument();
    });
    expect(screen.getByText("Search and filters")).toBeInTheDocument();
  });
});
