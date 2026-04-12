import type { SearchProvider, SearchResult } from "@/server/research/search-provider";

type TavilyProviderOptions = {
  apiKey: string;
  endpoint?: string;
  fetch?: typeof fetch;
};

type TavilyResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
};

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

function toSourceName(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function mapTavilyResults(payload: TavilyResponse): SearchResult[] {
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const result of payload.results ?? []) {
    if (typeof result.title !== "string" || typeof result.url !== "string") {
      continue;
    }

    if (!/^https?:\/\//i.test(result.url) || seen.has(result.url)) {
      continue;
    }

    seen.add(result.url);

    results.push({
      title: result.title.trim(),
      url: result.url,
      sourceName: toSourceName(result.url),
      sourceType: "web",
      snippet: typeof result.content === "string" ? result.content.trim() : undefined
    });
  }

  return results;
}

export function createTavilyProvider(options: TavilyProviderOptions): SearchProvider {
  const fetchImpl = options.fetch ?? fetch;
  const searchUrl = options.endpoint ?? TAVILY_SEARCH_URL;

  return {
    async search(query: string) {
      const response = await fetchImpl(searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: options.apiKey,
          query,
          search_depth: "basic",
          max_results: 5
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily search request failed with status ${response.status}`);
      }

      return mapTavilyResults((await response.json()) as TavilyResponse);
    }
  };
}
