import "@testing-library/jest-dom/vitest";

import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DebateTimeline } from "@/components/debate-timeline";

describe("DebateTimeline", () => {
  it("shows readable evidence references instead of raw ids", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(DebateTimeline as never, {
        turns: [
          {
            id: "t1",
            speaker: "Lumina",
            content:
              "Protect downside first. See 072c8a87-d2a0-449c-bf8d-4e50497a47ab for the housing risk.",
            referencedEvidenceIds: ["072c8a87-d2a0-449c-bf8d-4e50497a47ab"]
          }
        ],
        evidence: [
          {
            id: "072c8a87-d2a0-449c-bf8d-4e50497a47ab",
            title: "Housing market outlook",
            url: "https://example.com/housing",
            sourceName: "Example News",
            sourceType: "news",
            summary: "Rent remains elevated."
          }
        ],
        language: "zh-CN"
      })
    );

    expect(
      screen.getByText("Protect downside first. See 证据 1 for the housing risk.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /使用的证据.*证据 1.*Housing market outlook.*Example News/
      })
    ).toBeInTheDocument();
    expect(screen.queryByText("Rent remains elevated.")).not.toBeInTheDocument();
    expect(screen.queryByText("证据 072c8a87-d2a0-449c-bf8d-4e50497a47ab")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/072c8a87-d2a0-449c-bf8d-4e50497a47ab/)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /使用的证据/ }));

    expect(screen.getByText("Rent remains elevated.")).toBeInTheDocument();
  });

  it("shows each speech as a single-column card with collapsible analysis and cited evidence", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(DebateTimeline as never, {
        turns: [
          {
            id: "t1",
            speaker: "坤察",
            content: "岗位增长说明收益可能覆盖成本。",
            referencedEvidenceIds: ["e2", "e3", "e4"],
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
        ],
        evidence: [
          {
            id: "e2",
            title: "就业机会分析",
            url: "https://example.com/jobs",
            sourceName: "Example Jobs",
            sourceType: "analysis",
            summary: "新城市岗位供给更多。"
          },
          {
            id: "e3",
            title: "租金压力报告",
            url: "https://example.com/rent",
            sourceName: "Example Rent",
            sourceType: "report",
            summary: "目标城市租金上涨更快。"
          },
          {
            id: "e4",
            title: "家庭稳定性研究",
            url: "https://example.com/family",
            sourceName: "Example Family",
            sourceType: "study",
            summary: "搬迁会增加家庭适应成本。"
          }
        ],
        language: "zh-CN"
      })
    );

    const speechCard = screen.getByRole("article", { name: /回合 1.*坤察/ });

    expect(screen.queryByRole("region", { name: "乾明" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "坤察" })).not.toBeInTheDocument();
    expect(screen.queryByText("等待发言")).not.toBeInTheDocument();
    expect(within(speechCard).getByText("岗位增长说明收益可能覆盖成本。")).toBeInTheDocument();
    expect(within(speechCard).getByText("发言前分析")).toBeInTheDocument();
    expect(within(speechCard).getByText("事实问题：住房数据口径需要核对。")).toBeInTheDocument();
    expect(screen.queryByText("逻辑问题：把岗位增长直接等同于净收益。")).not.toBeInTheDocument();
    expect(screen.queryByText("价值问题：低估搬迁对家庭稳定的影响。")).not.toBeInTheDocument();
    expect(screen.queryByText("检索焦点：核对租金和岗位增长")).not.toBeInTheDocument();
    expect(screen.queryByText("私有证据")).not.toBeInTheDocument();
    expect(screen.queryByText("坤察：证据 1 · 就业机会分析")).not.toBeInTheDocument();
    const evidenceButton = within(speechCard).getByRole("button", { name: /使用的证据/ });

    expect(evidenceButton).toHaveTextContent("证据 1 · 就业机会分析 · Example Jobs");
    expect(evidenceButton).toHaveTextContent("证据 2 · 租金压力报告 · Example Rent");
    expect(evidenceButton).not.toHaveTextContent("证据 3 · 家庭稳定性研究 · Example Family");
    expect(within(speechCard).queryByText("新城市岗位供给更多。")).not.toBeInTheDocument();

    await user.click(within(speechCard).getByRole("button", { name: /发言前分析/ }));

    expect(within(speechCard).getByText("逻辑问题：把岗位增长直接等同于净收益。")).toBeInTheDocument();
    expect(within(speechCard).getByText("价值问题：低估搬迁对家庭稳定的影响。")).toBeInTheDocument();
    expect(within(speechCard).getByText("检索焦点：核对租金和岗位增长")).toBeInTheDocument();

    await user.click(within(speechCard).getByRole("button", { name: /使用的证据/ }));

    expect(
      within(speechCard).getAllByText("证据 1 · 就业机会分析 · Example Jobs").length
    ).toBeGreaterThan(0);
    expect(within(speechCard).getByText("证据 3 · 家庭稳定性研究 · Example Family")).toBeInTheDocument();
    expect(within(speechCard).getByText("新城市岗位供给更多。")).toBeInTheDocument();
  });
});
