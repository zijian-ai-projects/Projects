import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/debate/agent", () => ({
  createDebateAgent: () => ({
    createOpeningTurn: vi.fn(async () => {
      throw new Error("boom");
    })
  })
}));

import { runtime } from "@/server/runtime";

describe("runtime generic opening errors", () => {
  it("persists an unknown diagnosis for a non-provider opening failure", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "server-owned-deepseek-key");

    const session = await runtime.createSession({
      question: "Should I move to another city for work?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      language: "en",
      model: "deepseek-chat"
    });

    await runtime.continueSession(session.id);
    await expect(runtime.continueSession(session.id)).rejects.toThrow("boom");

    const stopped = await runtime.stopSession(session.id);
    expect(stopped.diagnosis).toMatchObject({
      stage: "opening",
      failingStep: "run-opening-round",
      providerBaseUrl: "https://api.deepseek.com",
      providerModel: "deepseek-chat",
      category: "unknown",
      detail: "boom"
    });
    expect(stopped.diagnosis?.summary).toContain("unexpected error");
    expect(stopped.diagnosis?.suggestedFix).toContain("provider compatibility");
  });
});
