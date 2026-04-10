import { describe, expect, it } from "vitest";
import { createResearchService } from "@/server/research/research-service";

describe("research service", () => {
  it("maps search results into cleaned evidence", async () => {
    const service = createResearchService({
      search: async () => [
        {
          title: "创业成功率研究",
          url: "https://example.com/startup",
          sourceName: "Example Research",
          sourceType: "research"
        }
      ],
      extract: async () => ({
        summary: "  Most startups fail within five years.  ",
        notableDataPoints: [
          "  Failure rates are high in the first five years.  ",
          " ",
          "Failure rates are high in the first five years.",
          "\tAnother point\t"
        ]
      })
    });

    const evidence = await service.buildSharedEvidence("Should I start a company?");
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: "创业成功率研究",
        url: "https://example.com/startup",
        sourceName: "Example Research",
        sourceType: "research",
        summary: "Most startups fail within five years.",
        dataPoints: [
          "Failure rates are high in the first five years.",
          "Another point"
        ]
      })
    );
  });

  it("returns an empty array when there are no search results", async () => {
    const service = createResearchService({
      search: async () => [],
      extract: async () => {
        throw new Error("extract should not be called");
      }
    });

    await expect(service.buildSharedEvidence("Should I start a company?")).resolves.toEqual([]);
  });

  it("throws when the search request fails", async () => {
    const service = createResearchService({
      search: async () => {
        throw new TypeError("fetch failed");
      },
      extract: async () => {
        throw new Error("extract should not be called");
      }
    });

    await expect(service.buildSharedEvidence("Should I start a company?")).rejects.toThrow("fetch failed");
  });

  it("skips results whose page extraction fails", async () => {
    const service = createResearchService({
      search: async () => [
        {
          title: "Broken source",
          url: "https://example.com/broken",
          sourceName: "Example",
          sourceType: "research"
        },
        {
          title: "Working source",
          url: "https://example.com/working",
          sourceName: "Example",
          sourceType: "research"
        }
      ],
      extract: async (url) => {
        if (url.endsWith("/broken")) {
          throw new Error("fetch failed");
        }

        return {
          summary: "Useful summary",
          notableDataPoints: ["Point 1"]
        };
      }
    });

    await expect(service.buildSharedEvidence("Should I start a company?")).resolves.toEqual([
      expect.objectContaining({
        title: "Working source",
        url: "https://example.com/working",
        summary: "Useful summary",
        dataPoints: ["Point 1"]
      })
    ]);
  });

  it("falls back to the search snippet when extraction fails but the result already has content", async () => {
    const service = createResearchService({
      search: async () => [
        {
          title: "Working source",
          url: "https://example.com/working",
          sourceName: "Example",
          sourceType: "research",
          snippet: "Rent increased 8% year over year."
        }
      ],
      extract: async () => {
        throw new Error("blocked");
      }
    });

    await expect(service.buildSharedEvidence("Should I start a company?")).resolves.toEqual([
      expect.objectContaining({
        title: "Working source",
        url: "https://example.com/working",
        summary: "Rent increased 8% year over year.",
        dataPoints: ["Rent increased 8% year over year."]
      })
    ]);
  });
});
