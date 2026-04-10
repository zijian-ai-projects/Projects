import type { PageExtractor } from "@/server/research/page-extractor";
import type { SearchProvider } from "@/server/research/search-provider";

export function createMockSearchProvider(): SearchProvider & PageExtractor {
  return {
    async search() {
      return [
        {
          title: "Mock result",
          url: "https://example.com/mock",
          sourceName: "Mock Source",
          sourceType: "news"
        }
      ];
    },
    async extract() {
      return {
        summary: "Mock summary",
        notableDataPoints: ["Mock data point"]
      };
    }
  };
}
