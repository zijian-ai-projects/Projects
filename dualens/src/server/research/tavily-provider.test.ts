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

  it("drops Tavily results that point at local or private URLs", () => {
    expect(
      mapTavilyResults({
        results: [
          {
            title: "Metadata",
            url: "http://169.254.169.254/latest/meta-data",
            content: "internal"
          },
          {
            title: "Loopback",
            url: "http://127.0.0.1:3000/admin",
            content: "internal"
          },
          {
            title: "Public report",
            url: "https://example.com/report",
            content: "Public summary."
          }
        ]
      })
    ).toEqual([
      {
        title: "Public report",
        url: "https://example.com/report",
        sourceName: "example.com",
        sourceType: "web",
        snippet: "Public summary."
      }
    ]);
  });
});
