import { describe, expect, it } from "vitest";
import { extractDuckDuckGoResults, extractPageSnapshot } from "@/server/research/duckduckgo-provider";

describe("duckduckgo provider helpers", () => {
  it("extracts search results from DuckDuckGo html", () => {
    const html = `
      <html>
        <body>
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Freport">
            Example Report
          </a>
          <a class="result__a" href="https://second.example/article">Second Article</a>
        </body>
      </html>
    `;

    expect(extractDuckDuckGoResults(html)).toEqual([
      {
        title: "Example Report",
        url: "https://example.com/report",
        sourceName: "example.com",
        sourceType: "web"
      },
      {
        title: "Second Article",
        url: "https://second.example/article",
        sourceName: "second.example",
        sourceType: "web"
      }
    ]);
  });

  it("captures result snippets so research can fall back when page extraction fails", () => {
    const html = `
      <html>
        <body>
          <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Freport">
            Example Report
          </a>
          <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Freport">
            Median rent rose 8% in 2025.
          </a>
        </body>
      </html>
    `;

    expect(extractDuckDuckGoResults(html)).toEqual([
      {
        title: "Example Report",
        url: "https://example.com/report",
        sourceName: "example.com",
        sourceType: "web",
        snippet: "Median rent rose 8% in 2025."
      }
    ]);
  });

  it("extracts a page snapshot with summary and notable data points", () => {
    const html = `
      <html>
        <head>
          <title>Report title</title>
          <meta name="description" content="Median rent rose 8% in 2025 while vacancy stayed low." />
        </head>
        <body>
          <main>
            <p>Median rent rose 8% in 2025 while vacancy stayed low.</p>
            <p>Average salary grew to 120000 dollars across the city.</p>
            <p>Transit access improved in the downtown core.</p>
          </main>
        </body>
      </html>
    `;

    expect(extractPageSnapshot(html)).toEqual({
      summary: "Median rent rose 8% in 2025 while vacancy stayed low.",
      notableDataPoints: [
        "Median rent rose 8% in 2025 while vacancy stayed low.",
        "Average salary grew to 120000 dollars across the city."
      ]
    });
  });
});
