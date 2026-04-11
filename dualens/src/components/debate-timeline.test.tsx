import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DebateTimeline } from "@/components/debate-timeline";

describe("DebateTimeline", () => {
  it("shows readable evidence references instead of raw ids", () => {
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

    expect(screen.getByText("证据 1 · Housing market outlook")).toBeInTheDocument();
    expect(
      screen.getByText("Protect downside first. See 证据 1 for the housing risk.")
    ).toBeInTheDocument();
    expect(screen.queryByText("证据 072c8a87-d2a0-449c-bf8d-4e50497a47ab")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/072c8a87-d2a0-449c-bf8d-4e50497a47ab/)
    ).not.toBeInTheDocument();
  });

  it("shows pre-speech analysis and private evidence for each turn", () => {
    render(
      React.createElement(DebateTimeline as never, {
        turns: [
          {
            id: "t1",
            speaker: "坤察",
            content: "岗位增长说明收益可能覆盖成本。",
            referencedEvidenceIds: ["e2"],
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
          }
        ],
        language: "zh-CN"
      })
    );

    expect(screen.getByText("发言前分析")).toBeInTheDocument();
    expect(screen.getByText("事实问题：住房数据口径需要核对。")).toBeInTheDocument();
    expect(screen.getByText("逻辑问题：把岗位增长直接等同于净收益。")).toBeInTheDocument();
    expect(screen.getByText("价值问题：低估搬迁对家庭稳定的影响。")).toBeInTheDocument();
    expect(screen.getByText("检索焦点：核对租金和岗位增长")).toBeInTheDocument();
    expect(screen.getByText("私有证据")).toBeInTheDocument();
    expect(screen.getByText("坤察：证据 1 · 就业机会分析")).toBeInTheDocument();
  });
});
