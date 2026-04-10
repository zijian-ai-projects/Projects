import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryPanel } from "@/components/summary-panel";

describe("SummaryPanel", () => {
  it("renders readable evidence labels instead of raw ids in Chinese summaries", () => {
    render(
      React.createElement(SummaryPanel as never, {
        summary: {
          strongestFor: [
            {
              text: "可以参考 072c8a87-d2a0-449c-bf8d-4e50497a47ab 这条证据。",
              evidenceIds: ["072c8a87-d2a0-449c-bf8d-4e50497a47ab"]
            }
          ],
          strongestAgainst: [],
          coreDisagreement: "双方对 072c8a87-d2a0-449c-bf8d-4e50497a47ab 的解读不同。",
          keyUncertainty: "暂无",
          nextAction: "继续核验 072c8a87-d2a0-449c-bf8d-4e50497a47ab 对应的数据。"
        },
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

    expect(screen.getByText("可以参考 证据 1 这条证据。")).toBeInTheDocument();
    expect(screen.getByText("双方对 证据 1 的解读不同。")).toBeInTheDocument();
    expect(screen.getByText("继续核验 证据 1 对应的数据。")).toBeInTheDocument();
    expect(screen.getByText("证据: 证据 1")).toBeInTheDocument();
    expect(
      screen.queryByText(/072c8a87-d2a0-449c-bf8d-4e50497a47ab/)
    ).not.toBeInTheDocument();
  });
});
