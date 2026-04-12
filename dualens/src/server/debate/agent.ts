import type { DebateTurnAnalysis, Evidence, SessionRecord, SpeakerSideKey } from "@/lib/types";
import { buildOpeningPrompt, buildTurnAnalysisPrompt } from "@/server/prompts";
import type { ChatMessage } from "@/server/llm/provider";

type DebateTurnCompletion = {
  speaker: string;
  content: string;
  referencedEvidenceIds: string[];
};

type DebateAgentCompletion = {
  complete(messages: ChatMessage[], schemaName: string): Promise<unknown>;
};

export function createDebateAgent(llm: DebateAgentCompletion) {
  return {
    async createOpeningTurn(
      session: SessionRecord,
      speaker: string,
      analysis?: DebateTurnAnalysis
    ) {
      return llm.complete(
        [
          {
            role: "user",
            content: `${buildOpeningPrompt(session, analysis)}\nSpeaker: ${speaker}`
          }
        ],
        "DebateTurn"
      ) as Promise<DebateTurnCompletion>;
    },
    async createTurnAnalysis(
      session: SessionRecord,
      side: SpeakerSideKey,
      visibleEvidence: Evidence[]
    ) {
      return llm.complete(
        [
          {
            role: "user",
            content: buildTurnAnalysisPrompt(session, side, visibleEvidence)
          }
        ],
        "DebateTurnAnalysis"
      ) as Promise<DebateTurnAnalysis>;
    }
  };
}
