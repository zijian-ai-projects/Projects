import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush
  })
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

import { HistoryPageContent } from "@/app/(workspace)/history/history-page-content";
import { SessionShell } from "@/components/session-shell";
import { APP_LANGUAGE_STORAGE_KEY, AppPreferencesProvider } from "@/lib/app-preferences";
import { DebateWorkspaceStateProvider } from "@/lib/debate-workspace-state";
import type { HistoryListRecord } from "@/lib/history-records";

function createHistoryRecord(
  question: string,
  overrides: Partial<HistoryListRecord> = {}
): HistoryListRecord {
  return {
    id: "h1",
    fileName: "h1.json",
    question,
    createdAt: "2026-04-10 14:28",
    createdAtIso: "2026-04-10T14:28:00.000Z",
    model: "deepseek-chat",
    searchEngine: "Tavily",
    roleSummary: "谨慎 / 激进",
    status: "complete",
    stage: "complete",
    language: "zh-CN",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    firstSpeaker: "lumina",
    evidenceCount: 2,
    turnCount: 3,
    summary: {
      coreDisagreement: "核心分歧",
      keyUncertainty: "关键不确定性",
      nextAction: "下一步行动"
    },
    ...overrides
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

    expect(deleteRecord).not.toHaveBeenCalled();
    expect(screen.getByText("如何安排下半年产品路线？")).toBeInTheDocument();

    await user.click(within(card as HTMLElement).getByRole("button", { name: "确认删除" }));

    expect(deleteRecord).toHaveBeenCalledWith("h1.json");
    expect(screen.queryByText("如何安排下半年产品路线？")).not.toBeInTheDocument();
  });

  it("cancels a pending history deletion before removing the card", async () => {
    const user = userEvent.setup();
    const deleteRecord = vi.fn(async () => ({ status: "deleted" as const }));

    renderHistoryPage({
      loadRecords: async () => ({
        status: "authorized",
        records: [createHistoryRecord("如何安排下半年产品路线？")]
      }),
      deleteRecord
    });

    const card = await screen.findByText("如何安排下半年产品路线？").then((node) => {
      const article = node.closest("article");
      if (!article) {
        throw new Error("Missing history card");
      }

      return article;
    });

    await user.click(within(card).getByRole("button", { name: "删除" }));
    expect(within(card).getByRole("button", { name: "确认删除" })).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: "取消" }));

    expect(deleteRecord).not.toHaveBeenCalled();
    expect(within(card).getByRole("button", { name: "删除" })).toBeInTheDocument();
  });

  it("toggles inline details for a saved history record", async () => {
    const user = userEvent.setup();

    renderHistoryPage({
      loadRecords: async () => ({
        status: "authorized",
        records: [createHistoryRecord("如何安排下半年产品路线？")]
      })
    });

    const card = await screen.findByText("如何安排下半年产品路线？").then((node) => {
      const article = node.closest("article");
      if (!article) {
        throw new Error("Missing history card");
      }

      return article;
    });

    await user.click(within(card).getByRole("button", { name: "查看详情" }));

    expect(within(card).getByText("搜索引擎：Tavily")).toBeInTheDocument();
    expect(within(card).getByText("证据：2")).toBeInTheDocument();
    expect(within(card).getByText("回合：3")).toBeInTheDocument();
    expect(within(card).getByText("下一步：下一步行动")).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: "查看详情" }));

    expect(within(card).queryByText("搜索引擎：Tavily")).not.toBeInTheDocument();
  });

  it("restores the debate draft and role settings when rerunning a history record", async () => {
    const user = userEvent.setup();

    function WorkspaceHarness() {
      const [route, setRoute] = useState<"history" | "debate">("history");

      routerPush.mockImplementation((href: string) => {
        if (href === "/debate") {
          setRoute("debate");
        }
      });

      return (
        <AppPreferencesProvider>
          <DebateWorkspaceStateProvider>
            {route === "history" ? (
              <HistoryPageContent
                loadRecords={async () => ({
                  status: "authorized",
                  records: [
                    createHistoryRecord("是否应该换一个城市工作？", {
                      roleSummary: "收益 / 成本",
                      presetSelection: {
                        pairId: "cost-benefit",
                        luminaTemperament: "benefit-focused"
                      },
                      firstSpeaker: "vigila"
                    })
                  ]
                })}
                deleteRecord={async () => ({ status: "skipped" })}
              />
            ) : (
              <SessionShell
                uiLanguage="zh-CN"
                createSession={vi.fn()}
                continueSession={vi.fn()}
              />
            )}
          </DebateWorkspaceStateProvider>
        </AppPreferencesProvider>
      );
    }

    render(<WorkspaceHarness />);

    const card = await screen.findByText("是否应该换一个城市工作？").then((node) => {
      const article = node.closest("article");
      if (!article) {
        throw new Error("Missing history card");
      }

      return article;
    });

    await user.click(within(card).getByRole("button", { name: "重新发起同题辩论" }));

    expect(routerPush).toHaveBeenCalledWith("/debate");
    expect(await screen.findByLabelText("决策问题")).toHaveValue("是否应该换一个城市工作？");
    const luminaCard = screen.getByText("乾明").closest("section");
    const vigilaCard = screen.getByText("坤察").closest("section");

    expect(luminaCard).toBeInTheDocument();
    expect(vigilaCard).toBeInTheDocument();
    expect(within(luminaCard as HTMLElement).getByRole("button", { name: "后" })).toBeInTheDocument();
    expect(within(vigilaCard as HTMLElement).getByRole("button", { name: "先" })).toBeInTheDocument();
    expect(screen.getByText("收益")).toBeInTheDocument();
    expect(screen.getByText("成本")).toBeInTheDocument();
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
