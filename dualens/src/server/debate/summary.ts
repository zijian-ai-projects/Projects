import type { SessionRecord } from "@/lib/types";
import { buildSummaryPrompt } from "@/server/prompts";
import type { StructuredCompletion } from "@/server/llm/provider";

export function createSummaryService(
  llm: StructuredCompletion<NonNullable<SessionRecord["summary"]>>
) {
  return {
    async generate(session: SessionRecord) {
      return llm.complete(
        [{ role: "user", content: buildSummaryPrompt(session) }],
        "DebateSummary"
      );
    }
  };
}
