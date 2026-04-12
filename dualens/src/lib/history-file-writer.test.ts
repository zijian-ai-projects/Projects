import { describe, expect, it } from "vitest";
import {
  buildHistoryFileName,
  serializeHistoryRecord
} from "@/lib/history-file-writer";

describe("history-file writer", () => {
  it("builds a stable timestamped filename for one session", () => {
    expect(buildHistoryFileName("session_7f2a1c", "2026-04-10T14:32:05.000Z")).toBe(
      "dualens-20260410-143205-session_7f2a1c.json"
    );
  });

  it("serializes the expected JSON shape", () => {
    const payload = serializeHistoryRecord(
      {
        createdAt: "2026-04-10T14:32:05.000Z",
        question: "Should I quit my job this year?",
        model: "deepseek-chat",
        searchEngine: "Tavily",
        presetSelection: {
          pairId: "cautious-aggressive",
          luminaTemperament: "cautious"
        },
        firstSpeaker: "lumina",
        language: "zh-CN"
      },
      {
        id: "session_7f2a1c",
        debateMode: "private-evidence",
        stage: "complete",
        evidence: [],
        privateEvidence: {
          lumina: [
            {
              id: "lumina-e1",
              title: "Lumina source",
              url: "https://example.com/lumina",
              sourceName: "Lumina Source",
              sourceType: "report",
              summary: "Lumina private evidence."
            }
          ]
        },
        turns: [
          {
            id: "t1",
            speaker: "乾明",
            side: "lumina",
            round: 1,
            content: "先看证据。",
            referencedEvidenceIds: ["lumina-e1"],
            privateEvidenceIds: ["lumina-e1"],
            analysis: {
              factualIssues: ["无上一轮事实可查。"],
              logicalIssues: [],
              valueIssues: [],
              searchFocus: "开场取证"
            }
          }
        ],
        summary: undefined
      }
    );

    expect(payload.question).toBe("Should I quit my job this year?");
    expect(payload.searchEngine).toBe("Tavily");
    expect(payload.debateMode).toBe("private-evidence");
    expect(payload.privateEvidence?.lumina?.[0]?.id).toBe("lumina-e1");
    expect(payload.turns[0]?.analysis?.searchFocus).toBe("开场取证");
    expect(payload.updatedAt).toBeDefined();
  });
});
