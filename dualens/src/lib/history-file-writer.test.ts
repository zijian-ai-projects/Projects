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
        stage: "complete",
        evidence: [],
        turns: [],
        summary: undefined
      }
    );

    expect(payload.question).toBe("Should I quit my job this year?");
    expect(payload.searchEngine).toBe("Tavily");
    expect(payload.updatedAt).toBeDefined();
  });
});
