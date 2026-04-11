import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HistoryPageContent } from "@/app/(workspace)/history/history-page-content";
import { APP_LANGUAGE_STORAGE_KEY, AppPreferencesProvider } from "@/lib/app-preferences";
import type { HistoryListRecord } from "@/lib/history-records";

function createHistoryRecord(question: string): HistoryListRecord {
  return {
    id: "h1",
    fileName: "h1.json",
    question,
    createdAt: "2026-04-10 14:28",
    createdAtIso: "2026-04-10T14:28:00.000Z",
    model: "deepseek-chat",
    roleSummary: "谨慎 / 激进",
    status: "complete"
  };
}

function renderHistoryPage(props: Partial<ComponentProps<typeof HistoryPageContent>> = {}) {
  render(
    <AppPreferencesProvider>
      <HistoryPageContent
        loadRecords={async () => ({ status: "authorized", records: [] })}
        deleteRecord={async () => ({ status: "skipped" })}
        {...props}
      />
    </AppPreferencesProvider>
  );
}

describe("HistoryPage", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders searchable history cards from saved JSON records", async () => {
    renderHistoryPage({
      loadRecords: async () => ({
        status: "authorized",
        records: [createHistoryRecord("如何安排下半年产品路线？")]
      })
    });

    expect(screen.getByRole("heading", { level: 1, name: "辩论历史" })).toBeInTheDocument();
    expect(screen.getByLabelText("搜索历史")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("如何安排下半年产品路线？")).toBeInTheDocument();
    });
    expect(screen.queryByText("是否应该在今年转去独立开发？")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "查看详情" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "重新发起同题辩论" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "删除" }).length).toBeGreaterThan(0);
  });

  it("deletes a saved history JSON record and removes the card", async () => {
    const user = userEvent.setup();
    const deleteRecord = vi.fn(async () => ({ status: "deleted" as const }));

    renderHistoryPage({
      loadRecords: async () => ({
        status: "authorized",
        records: [createHistoryRecord("如何安排下半年产品路线？")]
      }),
      deleteRecord
    });

    let card: HTMLElement | null = null;
    await waitFor(() => {
      card = screen.getByText("如何安排下半年产品路线？").closest("article");
      expect(card).toBeInTheDocument();
    });

    await user.click(within(card as HTMLElement).getByRole("button", { name: "删除" }));

    expect(deleteRecord).toHaveBeenCalledWith("h1.json");
    expect(screen.queryByText("如何安排下半年产品路线？")).not.toBeInTheDocument();
  });

  it("uses the stored English global language for page chrome", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    renderHistoryPage({
      loadRecords: async () => ({ status: "unselected", records: [] })
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Debate history" })).toBeInTheDocument();
    });
    expect(screen.getByText("Search and filters")).toBeInTheDocument();
  });
});
