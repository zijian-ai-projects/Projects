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
    debateMode: "shared-evidence",
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
    privateEvidence: {},
    evidence: [
      {
        id: "e1",
        title: "住房成本报告",
        url: "https://example.com/housing",
        sourceName: "Example Research",
        sourceType: "report",
        summary: "住房成本过去一年明显上升。",
        dataPoints: ["租金上涨 12%", "库存下降 8%"]
      },
      {
        id: "e2",
        title: "就业机会分析",
        url: "https://example.com/jobs",
        sourceName: "Example Jobs",
        sourceType: "analysis",
        summary: "新城市岗位供给更多。",
        dataPoints: ["岗位增长 18%"]
      }
    ],
    turns: [
      {
        id: "t1",
        speaker: "乾明",
        content: "应先控制搬迁成本，再评估机会。",
        referencedEvidenceIds: ["e1"],
        side: "lumina",
        round: 1
      },
      {
        id: "t2",
        speaker: "坤察",
        content: "岗位增长说明收益可能覆盖成本。",
        referencedEvidenceIds: ["e2"],
        side: "vigila",
        round: 1
      }
    ],
    summary: {
      strongestFor: [{ text: "机会增长明确。", evidenceIds: ["e2"] }],
      strongestAgainst: [{ text: "住房成本上升。", evidenceIds: ["e1"] }],
      coreDisagreement: "核心分歧",
      keyUncertainty: "关键不确定性",
      nextAction: "下一步行动"
    },
    ...overrides
  };
}

function createPrivateHistoryRecord(question: string): HistoryListRecord {
  return createHistoryRecord(question, {
    debateMode: "private-evidence",
    privateEvidence: {
      lumina: [
        {
          id: "e1",
          title: "住房成本报告",
          url: "https://example.com/housing",
          sourceName: "Example Research",
          sourceType: "report",
          summary: "住房成本过去一年明显上升。",
          dataPoints: ["租金上涨 12%", "库存下降 8%"]
        }
      ],
      vigila: [
        {
          id: "e2",
          title: "就业机会分析",
          url: "https://example.com/jobs",
          sourceName: "Example Jobs",
          sourceType: "analysis",
          summary: "新城市岗位供给更多。",
          dataPoints: ["岗位增长 18%"]
        }
      ]
    },
    turns: [
      {
        id: "t1",
        speaker: "乾明",
        content: "应先控制搬迁成本，再评估机会。",
        referencedEvidenceIds: ["e1"],
        side: "lumina",
        round: 1,
        privateEvidenceIds: ["e1"]
      },
      {
        id: "t2",
        speaker: "坤察",
        content: "岗位增长说明收益可能覆盖成本。",
        referencedEvidenceIds: ["e2"],
        side: "vigila",
        round: 1,
        privateEvidenceIds: ["e2"],
        analysis: {
          factualIssues: ["住房数据口径需要核对。"],
          logicalIssues: ["把岗位增长直接等同于净收益。"],
          valueIssues: ["低估搬迁对家庭稳定的影响。"],
          searchFocus: "核对租金和岗位增长"
        }
      }
    ]
  });
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
    const card = screen.getByText("如何安排下半年产品路线？").closest("article");

    expect(card).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("模型：deepseek-chat")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("搜索引擎：Tavily")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("辩论模式：共证衡辩")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("风格对：谨慎 / 激进")).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText(/角色设定/)).not.toBeInTheDocument();
    expect(screen.queryByText("是否应该在今年转去独立开发？")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "查看详情" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "重新发起同题辩论" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "删除" }).length).toBeGreaterThan(0);
  });

  it("opens a delete confirmation dialog before removing a history record", async () => {
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

    const dialog = screen.getByRole("dialog", { name: "确认删除" });

    expect(deleteRecord).not.toHaveBeenCalled();
    expect(within(dialog).getByText("如何安排下半年产品路线？")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("如何安排下半年产品路线？")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "确认删除" }));

    expect(deleteRecord).toHaveBeenCalledWith("h1.json");
    expect(screen.queryByText("如何安排下半年产品路线？")).not.toBeInTheDocument();
  });

  it("cancels a delete confirmation dialog before removing the card", async () => {
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
    const dialog = screen.getByRole("dialog", { name: "确认删除" });

    await user.click(within(dialog).getByRole("button", { name: "取消" }));

    expect(deleteRecord).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "确认删除" })).not.toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "删除" })).toBeInTheDocument();
  });

  it("opens a collapsible debate-process details dialog for a saved history record", async () => {
    const user = userEvent.setup();

    renderHistoryPage({
      loadRecords: async () => ({
        status: "authorized",
        records: [createPrivateHistoryRecord("如何安排下半年产品路线？")]
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

    const dialog = screen.getByRole("dialog", { name: "辩论详情" });

    expect(within(dialog).getByText("辩论模式：隔证三辩")).toBeInTheDocument();
    expect(within(dialog).getByText("搜索引擎：Tavily")).toBeInTheDocument();
    expect(within(dialog).getByText("风格对：谨慎 / 激进")).toBeInTheDocument();
    expect(within(dialog).queryByText(/角色设定/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("住房成本报告")).toBeInTheDocument();
    expect(within(dialog).queryByText("住房成本过去一年明显上升。")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("租金上涨 12%")).not.toBeInTheDocument();
    expect(within(dialog).getByText("乾明持有")).toBeInTheDocument();
    expect(within(dialog).getByText("坤察持有")).toBeInTheDocument();
    expect(within(dialog).queryByText("应先控制搬迁成本，再评估机会。")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("岗位增长说明收益可能覆盖成本。")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("发言前分析")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /证据 1.*住房成本报告/ }));

    expect(within(dialog).getByText("住房成本过去一年明显上升。")).toBeInTheDocument();
    expect(within(dialog).getByText("租金上涨 12%")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /回合 1.*乾明/ }));

    expect(within(dialog).getByText("应先控制搬迁成本，再评估机会。")).toBeInTheDocument();
    expect(within(dialog).getByText("证据 1 · 住房成本报告")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /回合 2.*坤察/ }));

    expect(within(dialog).getByText("岗位增长说明收益可能覆盖成本。")).toBeInTheDocument();
    expect(within(dialog).getByText("发言前分析")).toBeInTheDocument();
    expect(within(dialog).getByText("事实问题：住房数据口径需要核对。")).toBeInTheDocument();
    expect(within(dialog).getByText("逻辑问题：把岗位增长直接等同于净收益。")).toBeInTheDocument();
    expect(within(dialog).getByText("价值问题：低估搬迁对家庭稳定的影响。")).toBeInTheDocument();
    expect(within(dialog).getByText("检索焦点：核对租金和岗位增长")).toBeInTheDocument();
    expect(within(dialog).getByTestId("history-turn-analysis")).not.toHaveClass("border");
    expect(within(dialog).getByTestId("history-turn-analysis")).not.toHaveClass("rounded-[8px]");
    expect(within(dialog).getByTestId("history-turn-analysis")).not.toHaveClass("bg-black/[0.02]");
    expect(within(dialog).queryByRole("button", { name: /发言前分析/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByText("私有证据")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("坤察：就业机会分析")).not.toBeInTheDocument();
    expect(within(dialog).getByText("机会增长明确。")).toBeInTheDocument();
    expect(within(dialog).getByText("下一步：下一步行动")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "关闭" }));

    expect(screen.queryByRole("dialog", { name: "辩论详情" })).not.toBeInTheDocument();
  });

  it("closes the debate details dialog when clicking outside the dialog surface", async () => {
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

    expect(screen.getByRole("dialog", { name: "辩论详情" })).toBeInTheDocument();

    await user.click(screen.getByTestId("history-dialog-backdrop"));

    expect(screen.queryByRole("dialog", { name: "辩论详情" })).not.toBeInTheDocument();
  });

  it("restores the debate draft and role settings when rerunning a history record", async () => {
    const user = userEvent.setup();

    function WorkspaceHarness() {
      const [route, setRoute] = useState<"history" | "app">("history");

      routerPush.mockImplementation((href: string) => {
        if (href === "/app") {
          setRoute("app");
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
                      debateMode: "private-evidence",
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

    expect(routerPush).toHaveBeenCalledWith("/app");
    expect(await screen.findByLabelText("决策问题")).toHaveValue("是否应该换一个城市工作？");
    const luminaCard = screen.getByText("乾明").closest("section");
    const vigilaCard = screen.getByText("坤察").closest("section");

    expect(luminaCard).toBeInTheDocument();
    expect(vigilaCard).toBeInTheDocument();
    expect(within(luminaCard as HTMLElement).getByRole("button", { name: "后" })).toBeInTheDocument();
    expect(within(vigilaCard as HTMLElement).getByRole("button", { name: "先" })).toBeInTheDocument();
    expect(screen.getByText("收益")).toBeInTheDocument();
    expect(screen.getByText("成本")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /隔证三辩/ })).toBeInTheDocument();
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
