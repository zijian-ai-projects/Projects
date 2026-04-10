import type { ExtractedPage, PageExtractor } from "@/server/research/page-extractor";
import type { SearchProvider, SearchResult } from "@/server/research/search-provider";

type DuckDuckGoProviderOptions = {
  fetch?: typeof fetch;
};

const DUCKDUCKGO_HTML_URL = "https://html.duckduckgo.com/html/";
const MAX_RESULTS = 5;
const MAX_DATA_POINTS = 3;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(rawUrl: string) {
  const trimmed = decodeHtmlEntities(rawUrl).trim();
  const withProtocol = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  const url = new URL(withProtocol);
  const redirectTarget = url.searchParams.get("uddg");
  return redirectTarget ? decodeURIComponent(redirectTarget) : url.toString();
}

function toSourceName(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function extractSnippetFromTrailingHtml(html: string) {
  const snippetMatch = html.match(
    /<(?:a|div|span)[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div|span)>/i
  );
  const snippet = snippetMatch?.[1] ? stripTags(decodeHtmlEntities(snippetMatch[1])) : "";
  return snippet.trim().length > 0 ? snippet.trim() : undefined;
}

export function extractDuckDuckGoResults(html: string): SearchResult[] {
  const matches = [...html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const [index, match] of matches.entries()) {
    const rawUrl = match[1];
    const rawTitle = match[2];
    if (!rawUrl || !rawTitle) {
      continue;
    }

    const url = normalizeUrl(rawUrl);
    if (!/^https?:\/\//i.test(url) || seen.has(url)) {
      continue;
    }

    seen.add(url);

    const currentMatchEnd = (match.index ?? 0) + match[0].length;
    const nextMatchStart = matches[index + 1]?.index ?? html.length;
    const snippet = extractSnippetFromTrailingHtml(html.slice(currentMatchEnd, nextMatchStart));

    results.push({
      title: stripTags(rawTitle),
      url,
      sourceName: toSourceName(url),
      sourceType: "web",
      snippet
    });
  }

  return results.slice(0, MAX_RESULTS);
}

function pickSummary(text: string, metaDescription?: string) {
  if (metaDescription && metaDescription.trim().length > 0) {
    return metaDescription.trim();
  }

  const sentences = text
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return sentences.slice(0, 2).join(" ").trim();
}

function extractNotableDataPoints(text: string) {
  return text
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => /\d|%|\$|usd|rmb|yuan|year/i.test(sentence))
    .slice(0, MAX_DATA_POINTS);
}

export function extractPageSnapshot(html: string): ExtractedPage {
  const metaDescriptionMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );
  const metaDescription = metaDescriptionMatch?.[1]
    ? decodeHtmlEntities(metaDescriptionMatch[1]).trim()
    : undefined;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const text = stripTags(bodyMatch?.[1] ?? html);
  const summary = pickSummary(text, metaDescription);
  const notableDataPoints = extractNotableDataPoints(text);

  return {
    summary: summary.length > 0 ? summary : "No summary available.",
    notableDataPoints
  };
}

export function createDuckDuckGoProvider(
  options: DuckDuckGoProviderOptions = {}
): SearchProvider & PageExtractor {
  const fetchImpl = options.fetch ?? fetch;

  return {
    async search(query: string) {
      const response = await fetchImpl(`${DUCKDUCKGO_HTML_URL}?q=${encodeURIComponent(query)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html"
        }
      });

      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`);
      }

      return extractDuckDuckGoResults(await response.text());
    },
    async extract(url: string) {
      const response = await fetchImpl(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html,application/xhtml+xml"
        }
      });

      if (!response.ok) {
        throw new Error(`Page extract request failed with status ${response.status}`);
      }

      return extractPageSnapshot(await response.text());
    }
  };
}
