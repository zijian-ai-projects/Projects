import { describe, expect, it, vi } from "vitest";
import {
  createDuckDuckGoProvider,
  extractDuckDuckGoResults,
  extractPageSnapshot
} from "@/server/research/duckduckgo-provider";

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

  it("does not fetch local or private page extraction URLs", async () => {
    const fetchMock = vi.fn(async () => new Response("<html><body>internal</body></html>"));
    const provider = createDuckDuckGoProvider({
      fetch: fetchMock as unknown as typeof fetch,
      resolveHostname: async (hostname) => [hostname]
    });

    await expect(provider.extract("http://127.0.0.1:3000/admin")).rejects.toThrow(/not allowed/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fetch public hostnames that resolve to private addresses", async () => {
    const fetchMock = vi.fn(async () => new Response("<html><body>internal</body></html>"));
    const provider = createDuckDuckGoProvider({
      fetch: fetchMock as unknown as typeof fetch,
      resolveHostname: async () => ["10.0.0.5"]
    });

    await expect(provider.extract("https://public.example/admin")).rejects.toThrow(/not allowed/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not follow redirects to local or private page extraction URLs", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: {
          Location: "http://169.254.169.254/latest/meta-data"
        }
      })
    );
    const provider = createDuckDuckGoProvider({
      fetch: fetchMock as unknown as typeof fetch,
      resolveHostname: async (hostname) => [hostname]
    });

    await expect(provider.extract("https://example.com/redirect")).rejects.toThrow(/not allowed/i);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
