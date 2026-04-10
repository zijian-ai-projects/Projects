import { describe, expect, it } from "vitest";
import { mapTavilyResults } from "@/server/research/tavily-provider";

describe("tavily provider", () => {
  it("maps Tavily search payloads into search results", () => {
    expect(
      mapTavilyResults({
        results: [
          {
            title: "Housing report",
            url: "https://example.com/housing",
            content: "Rent increased.",
            raw_content: ""
          },
          {
            title: "Salary guide",
            url: "https://example.com/salary",
            content: "Compensation trends.",
            raw_content: ""
          }
        ]
      })
    ).toEqual([
      {
        title: "Housing report",
        url: "https://example.com/housing",
        sourceName: "example.com",
        sourceType: "web",
        snippet: "Rent increased."
      },
      {
        title: "Salary guide",
        url: "https://example.com/salary",
        sourceName: "example.com",
        sourceType: "web",
        snippet: "Compensation trends."
      }
    ]);
  });
});
