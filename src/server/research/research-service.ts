import { randomUUID } from "node:crypto";
import type { Evidence } from "@/lib/types";
import type { ExtractedPage } from "@/server/research/page-extractor";
import type { PageExtractor } from "@/server/research/page-extractor";
import type { SearchProvider, SearchResult } from "@/server/research/search-provider";

function normalizeExtractedPage(extracted: ExtractedPage) {
  const seen = new Set<string>();
  const dataPoints = extracted.notableDataPoints
    .map((dataPoint) => dataPoint.trim())
    .filter((dataPoint) => dataPoint.length > 0)
    .filter((dataPoint) => {
      if (seen.has(dataPoint)) {
        return false;
      }

      seen.add(dataPoint);
      return true;
    });

  return {
    summary: extracted.summary.trim(),
    dataPoints
  };
}

function buildEvidenceFromSnippet(result: SearchProvider["search"] extends (...args: never[]) => Promise<(infer T)[]> ? T : never) {
  const snippet = typeof result.snippet === "string" ? result.snippet.trim() : "";
  if (snippet.length === 0) {
    return undefined;
  }

  return {
    summary: snippet,
    dataPoints: /\d|%|\$|usd|rmb|yuan|year/i.test(snippet) ? [snippet] : []
  };
}

export function createResearchService(deps: SearchProvider & PageExtractor) {
  return {
    async buildSharedEvidence(
      question: string,
      hooks?: {
        onResultsFound?: (results: SearchResult[]) => void | Promise<void>;
        onEvidenceBuilt?: (evidence: Evidence, result: SearchResult) => void | Promise<void>;
      }
    ): Promise<Evidence[]> {
      const results = await deps.search(question);

      await hooks?.onResultsFound?.(results);

      const evidence: Evidence[] = [];

      for (const result of results) {
        let built: Evidence | undefined;
        try {
          const extracted = await deps.extract(result.url);
          const normalized = normalizeExtractedPage(extracted);

          built = {
            id: randomUUID(),
            title: result.title,
            url: result.url,
            sourceName: result.sourceName,
            sourceType: result.sourceType,
            summary: normalized.summary,
            dataPoints: normalized.dataPoints
          };
        } catch {
          const fallback = buildEvidenceFromSnippet(result);
          if (fallback) {
            built = {
              id: randomUUID(),
              title: result.title,
              url: result.url,
              sourceName: result.sourceName,
              sourceType: result.sourceType,
              summary: fallback.summary,
              dataPoints: fallback.dataPoints
            };
          }
        }

        if (built) {
          evidence.push(built);
          await hooks?.onEvidenceBuilt?.(built, result);
        }
      }

      return evidence;
    }
  };
}
