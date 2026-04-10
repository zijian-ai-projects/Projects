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
});
