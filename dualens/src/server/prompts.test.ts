import { describe, expect, it } from "vitest";
import { buildOpeningPrompt, buildSummaryPrompt } from "@/server/prompts";
import type { SessionRecord } from "@/lib/types";

function createSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "session-1",
    question: "Should I move to another city for work?",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    firstSpeaker: "lumina",
    language: "en",
    stage: "debate",
    config: {
      sourceStrategy: "credible-first",
      searchDepth: "standard",
      roundCount: 1,
      summaryStyle: "balanced",
      provider: {
        baseUrl: "https://api.deepseek.com",
        apiKey: "server-key",
        model: "deepseek-chat"
      }
    },
    evidence: [
      {
        id: "e1",
        title: "Housing market outlook",
        url: "https://example.com/housing",
        sourceName: "Example News",
        sourceType: "news",
        summary: "Housing remains expensive in the target city.",
        dataPoints: ["Median rent increased 8% year over year"]
      }
    ],
    turns: [
      {
        id: "t1",
        speaker: "Lumina",
        content: "Protect downside first.",
        referencedEvidenceIds: ["e1"]
      }
    ],
    ...overrides
  };
}

describe("prompt JSON instructions", () => {
  it("tells opening generation to return JSON matching DebateTurn", () => {
    const prompt = buildOpeningPrompt(createSession());

    expect(prompt.toLowerCase()).toContain("json");
    expect(prompt).toContain('"speaker"');
    expect(prompt).toContain('"content"');
    expect(prompt).toContain('"referencedEvidenceIds"');
    expect(prompt).toContain("Return only valid JSON");
  });

  it("tells summary generation to return JSON matching DebateSummary", () => {
    const prompt = buildSummaryPrompt(createSession());

    expect(prompt.toLowerCase()).toContain("json");
    expect(prompt).toContain('"strongestFor"');
    expect(prompt).toContain('"strongestAgainst"');
    expect(prompt).toContain('"coreDisagreement"');
    expect(prompt).toContain('"keyUncertainty"');
    expect(prompt).toContain('"nextAction"');
    expect(prompt).toContain("Return only valid JSON");
  });

  it("forces the summary to use the session language and keeps raw ids out of prose", () => {
    const prompt = buildSummaryPrompt(createSession({ language: "zh-CN" }));

    expect(prompt).toContain("Language: zh-CN");
    expect(prompt).toContain("Write every text field in zh-CN.");
    expect(prompt).toContain("Never print raw evidence ids in any text field.");
  });
});
