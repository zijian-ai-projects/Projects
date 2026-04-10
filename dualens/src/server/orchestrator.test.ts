import { describe, expect, it } from "vitest";
import { TEMPERAMENT_PAIRS } from "@/lib/presets";
import type { SessionRecord } from "@/lib/types";
import { createSessionInputSchema } from "@/lib/validators";
import { createDebateAgent } from "@/server/debate/agent";
import { createSessionStore } from "@/server/session-store";
import { createOrchestrator } from "@/server/orchestrator";

const providerConfig = {
  baseUrl: "https://example.com/v1",
  apiKey: "test-key",
  model: "gpt-4o-mini"
};

function createSessionInput(overrides: Record<string, unknown> = {}) {
  return {
    question: "Should I move to another city for a job?",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    language: "en",
    config: {
      provider: providerConfig
    },
    ...overrides
  };
}

describe("orchestrator", () => {
  it("creates a session in research stage and then advances to opening", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const session = await orchestrator.createSession(createSessionInput());

    expect(session.stage).toBe("research");

    const advanced = await orchestrator.continueSession(session.id);
    expect(advanced.stage).toBe("opening");
  });

  it("persists research progress metadata while moving into opening", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [
        {
          id: "e1",
          title: "Sample source",
          url: "https://example.com",
          sourceName: "Example",
          sourceType: "news",
          summary: "A sample evidence item."
        }
      ],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const created = await orchestrator.createSession({
      question: "Should I move to another city for work?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      language: "en",
      config: {
        provider: providerConfig
      }
    });

    const next = await orchestrator.continueSession(created.id);
    expect(next.researchProgress?.stage).toBe("preparing-opening");
    expect(next.researchProgress?.sourceCount).toBe(1);
  });

  it("counts distinct sources in research progress when multiple evidence items share a source", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [
        {
          id: "e1",
          title: "First article",
          url: "https://example.com/a",
          sourceName: "Example News",
          sourceType: "news",
          summary: "First evidence item."
        },
        {
          id: "e2",
          title: "Second article",
          url: "https://example.com/b",
          sourceName: "Example News",
          sourceType: "news",
          summary: "Second evidence item."
        }
      ],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const created = await orchestrator.createSession({
      question: "Should I move to another city for work?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      language: "en",
      config: {
        provider: providerConfig
      }
    });

    const next = await orchestrator.continueSession(created.id);

    expect(next.researchProgress?.sourceCount).toBe(1);
    expect(next.researchProgress?.evidenceCount).toBe(2);
  });

  it("counts distinct sources in research progress", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [
        {
          id: "e-1",
          title: "First evidence",
          url: "https://source.example/1",
          sourceName: "Example Source",
          sourceType: "article",
          summary: "First note."
        },
        {
          id: "e-2",
          title: "Second evidence",
          url: "https://source.example/2",
          sourceName: "Example Source",
          sourceType: "article",
          summary: "Second note."
        }
      ],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const created = await orchestrator.createSession(createSessionInput());
    const next = await orchestrator.continueSession(created.id);

    expect(next.researchProgress?.evidenceCount).toBe(2);
    expect(next.researchProgress?.sourceCount).toBe(1);
  });

  it("preserves language and structured preset selection when creating a session", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const session = await orchestrator.createSession(
      createSessionInput({
        presetSelection: {
          pairId: "rational-intuitive",
          luminaTemperament: "rational"
        }
      })
    );

    expect(session.language).toBe("en");
    expect(session.presetSelection.pairId).toBe("rational-intuitive");
    expect(session.presetSelection.luminaTemperament).toBe("rational");
    expect(store.get(session.id)?.language).toBe("en");
    expect(store.get(session.id)?.presetSelection.pairId).toBe("rational-intuitive");
  });

  it("rejects an unknown temperament pair when creating a session", async () => {
    expect(() =>
      createSessionInputSchema.parse(
        createSessionInput({
          presetSelection: {
            pairId: "not-a-real-pair",
            luminaTemperament: "cautious"
          }
        })
      )
    ).toThrow();
  });

  it("persists research output on continueSession", async () => {
    const store = createSessionStore();
    const evidence = [
      {
        id: "e-1",
        title: "Sample source",
        url: "https://example.com",
        sourceName: "Example",
        sourceType: "article",
        summary: "A sample evidence item."
      }
    ];

    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => evidence,
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const session = await orchestrator.createSession(createSessionInput());

    const advanced = await orchestrator.continueSession(session.id);

    expect(advanced.evidence).toEqual(evidence);
    expect(advanced.stage).toBe("opening");
  });

  it("throws when continuing an unknown session id", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    await expect(orchestrator.continueSession("missing-session")).rejects.toThrow(
      "Session not found"
    );
  });

  it("throws if opening round returns a different session id", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [],
      runOpeningRound: async (session) => ({ ...session, id: "different-id" }),
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const session = await orchestrator.createSession(createSessionInput());

    store.save({ ...session, stage: "opening" });

    await expect(orchestrator.continueSession(session.id)).rejects.toThrow(
      "Opening round returned a different session id"
    );
  });

  it("throws if opening round mutates the provided session id in place", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [],
      runOpeningRound: async (session) => {
        session.id = "different-id";
        return session;
      },
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [],
        strongestAgainst: [],
        coreDisagreement: "",
        keyUncertainty: "",
        nextAction: ""
      })
    });

    const session = await orchestrator.createSession(createSessionInput());

    store.save({ ...session, stage: "opening" });

    await expect(orchestrator.continueSession(session.id)).rejects.toThrow(
      "Opening round returned a different session id"
    );
  });

  it("runs a summary once the debate round count is exhausted", async () => {
    const store = createSessionStore();
    const orchestrator = createOrchestrator(store, {
      runSharedResearch: async () => [],
      runOpeningRound: async (session) => session,
      runDebateRound: async (session) => session,
      runSummary: async () => ({
        strongestFor: [{ text: "Keep the runway.", evidenceIds: ["e-1"] }],
        strongestAgainst: [{ text: "The upside may justify it.", evidenceIds: ["e-2"] }],
        coreDisagreement: "Risk tolerance.",
        keyUncertainty: "Market demand.",
        nextAction: "Validate demand."
      })
    });

    const session = await orchestrator.createSession(createSessionInput());

    store.save({
      ...session,
      stage: "debate",
      turns: [
        { id: "t-1", speaker: "left", content: "...", referencedEvidenceIds: [] },
        { id: "t-2", speaker: "right", content: "...", referencedEvidenceIds: [] },
        { id: "t-3", speaker: "left", content: "...", referencedEvidenceIds: [] },
        { id: "t-4", speaker: "right", content: "...", referencedEvidenceIds: [] },
        { id: "t-5", speaker: "left", content: "...", referencedEvidenceIds: [] },
        { id: "t-6", speaker: "right", content: "...", referencedEvidenceIds: [] }
      ]
    });

    const advanced = await orchestrator.continueSession(session.id);

    expect(advanced.stage).toBe("complete");
    expect(advanced.summary?.strongestFor[0]?.evidenceIds).toContain("e-1");
  });

  it("includes fixed identities and mapped temperaments in the opening turn prompt", async () => {
    let prompt = "";
    const agent = createDebateAgent({
      complete: async (messages) => {
        prompt = messages[0]?.content ?? "";
        return {
          speaker: "left",
          content: "Opening position",
          referencedEvidenceIds: []
        };
      }
    });

    const session: SessionRecord = {
      id: "session-1",
      question: "Should I move to another city for a job?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      firstSpeaker: "lumina",
      language: "en",
      stage: "opening",
      config: {
        sourceStrategy: "credible-first",
        searchDepth: "standard",
        roundCount: 3,
        summaryStyle: "balanced",
        provider: providerConfig
      },
      evidence: [
        {
          id: "e-1",
          title: "Sample source",
          url: "https://example.com",
          sourceName: "Example",
          sourceType: "article",
          summary: "A sample evidence item."
        }
      ],
      turns: []
    };

    await agent.createOpeningTurn(session, "Lumina");

    expect(prompt).toContain("Preset pair: Cautious / Aggressive");
    expect(prompt).toContain("Language: en");
    expect(prompt).toContain("Lumina: Cautious");
    expect(prompt).toContain("Vigila: Aggressive");
    expect(prompt).toContain("Speaker: Lumina");
  });
});

describe("ux pass session config", () => {
  it("includes multiple visible preset pairs", () => {
    expect(TEMPERAMENT_PAIRS.map((pair) => pair.id)).toEqual([
      "cautious-aggressive",
      "rational-intuitive",
      "cost-benefit",
      "short-long"
    ]);
  });

  it("accepts a language and structured preset selection", () => {
    const parsed = createSessionInputSchema.parse({
      question: "Should I move to another city for work?",
      presetSelection: {
        pairId: "rational-intuitive",
        luminaTemperament: "rational"
      },
      language: "zh-CN",
      model: "deepseek-chat",
      config: {
        roundCount: 2
      }
    });

    expect(parsed.language).toBe("zh-CN");
    expect(parsed.presetSelection.pairId).toBe("rational-intuitive");
    expect(parsed.presetSelection.luminaTemperament).toBe("rational");
    expect(parsed.model).toBe("deepseek-chat");
  });
});
