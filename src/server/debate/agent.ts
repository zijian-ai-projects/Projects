import type { SessionRecord } from "@/lib/types";
import { buildOpeningPrompt } from "@/server/prompts";
import type { StructuredCompletion } from "@/server/llm/provider";

export function createDebateAgent(
  llm: StructuredCompletion<{ speaker: string; content: string; referencedEvidenceIds: string[] }>
) {
  return {
    async createOpeningTurn(session: SessionRecord, speaker: string) {
      return llm.complete(
        [
          {
            role: "user",
            content: `${buildOpeningPrompt(session)}\nSpeaker: ${speaker}`
          }
        ],
        "DebateTurn"
      );
    }
  };
}
