import type { SessionRecord } from "@/lib/types";
import { GET as sessionGET } from "@/app/api/session/[sessionId]/route";
import { POST } from "@/app/api/session/route";
import { POST as continuePOST } from "@/app/api/session/[sessionId]/continue/route";
import { POST as premisePOST } from "@/app/api/session/[sessionId]/premise/route";
import { POST as stopPOST } from "@/app/api/session/[sessionId]/stop/route";
import { runtime } from "@/server/runtime";
import { createSessionStore } from "@/server/session-store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SERVER_DEEPSEEK_API_KEY = "server-owned-deepseek-key";

function createSessionBody(overrides: Record<string, unknown> = {}) {
  return {
    question: "Should I move to another city?",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    firstSpeaker: "lumina",
    language: "en",
    model: "deepseek-chat",
    ...overrides
  };
}

async function createSession() {
  const response = await POST(
    new Request("http://localhost/api/session", {
      method: "POST",
      body: JSON.stringify(createSessionBody())
    })
  );

  return response.json() as Promise<{ id: string }>;
}

beforeEach(() => {
  vi.stubEnv("DEEPSEEK_API_KEY", SERVER_DEEPSEEK_API_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/session", () => {
  it("creates a session and returns json", async () => {
    const request = new Request("http://localhost/api/session", {
      method: "POST",
      body: JSON.stringify(createSessionBody())
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.stage).toBe("research");
    expect(payload.config.provider.baseUrl).toBe("https://api.deepseek.com");
    expect(payload.config.provider.model).toBe("deepseek-chat");
    expect(payload.config.provider).not.toHaveProperty("apiKey");
  });

  it("accepts and preserves a non-default firstSpeaker value", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify(createSessionBody({ firstSpeaker: "vigila" }))
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.firstSpeaker).toBe("vigila");
  });

  it("returns 400 for an invalid create payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify({
          ...createSessionBody(),
          question: "too short"
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
  });

  it("rejects provider config fields at the client boundary", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify({
          ...createSessionBody(),
          config: {
            provider: {
              baseUrl: "https://example.com/v1",
              apiKey: "client-key",
              model: "demo-model"
            }
          }
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
  });

  it("rejects legacy provider fields at the client boundary", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify({
          ...createSessionBody(),
          providerBaseUrl: "https://example.com/v1",
          providerApiKey: "client-key",
          providerModel: "demo-model"
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
  });

  it("returns 400 for an invalid premise payload", async () => {
    const session = await createSession();
    const response = await premisePOST(
      new Request("http://localhost/api/session/" + session.id + "/premise", {
        method: "POST",
        body: JSON.stringify({
          premise: "   "
        })
      }),
      { params: Promise.resolve({ sessionId: session.id }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
  });

  it("accepts and normalizes a premise value", async () => {
    const session = await createSession();
    const response = await premisePOST(
      new Request("http://localhost/api/session/" + session.id + "/premise", {
        method: "POST",
        body: JSON.stringify({
          premise: "  value  "
        })
      }),
      { params: Promise.resolve({ sessionId: session.id }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.premise).toBe("value");
    expect(payload.config.provider).not.toHaveProperty("apiKey");
  });

  it("returns 404 for an unknown session id on continue", async () => {
    const response = await continuePOST(
      new Request("http://localhost/api/session/missing-session/continue", {
        method: "POST"
      }),
      { params: Promise.resolve({ sessionId: "missing-session" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBeDefined();
  });

  it("returns the latest session snapshot for polling", async () => {
    const created = await createSession();

    const response = await sessionGET(
      new Request(`http://localhost/api/session/${created.id}`, {
        method: "GET"
      }),
      { params: Promise.resolve({ sessionId: created.id }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.id).toBe(created.id);
    expect(payload.config.provider).not.toHaveProperty("apiKey");
  });

  it("returns persisted diagnosis details when continue fails after the session has already been classified", async () => {
    const sessionStore = createSessionStore();
    const diagnosis = {
      stage: "opening",
      failingStep: "run-opening-round",
      providerBaseUrl: "https://api.deepseek.com/v1",
      providerModel: "deepseek-chat",
      category: "auth",
      summary: "Authentication failed while contacting the model endpoint.",
      detail: "OpenAI-compatible request failed with status 401",
      suggestedFix: "Check the API key and confirm the endpoint accepts it."
    } as const;
    const session = {
      id: "persisted-diagnosis-session",
      question: "Should I move to another city?",
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
        roundCount: 2,
        summaryStyle: "balanced",
        provider: {
          baseUrl: "https://api.deepseek.com",
          apiKey: "server-owned-key",
          model: "deepseek-chat"
        }
      },
      evidence: [],
      turns: [],
      diagnosis
    } satisfies SessionRecord;

    sessionStore.save(session);
    const continueSpy = vi
      .spyOn(runtime, "continueSession")
      .mockRejectedValue(new Error("OpenAI-compatible request failed with status 401"));

    try {
      const response = await continuePOST(
        new Request("http://localhost/api/session/persisted-diagnosis-session/continue", {
          method: "POST"
        }),
        { params: Promise.resolve({ sessionId: "persisted-diagnosis-session" }) }
      );

      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.error).toBe("OpenAI-compatible request failed with status 401");
      expect(payload.diagnosis).toMatchObject(diagnosis);
    } finally {
      continueSpy.mockRestore();
    }
  });

  it("drops malformed persisted diagnosis details when continue fails", async () => {
    const sessionStore = createSessionStore();
    const session = {
      id: "malformed-diagnosis-session",
      question: "Should I move to another city?",
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
        roundCount: 2,
        summaryStyle: "balanced",
        provider: {
          baseUrl: "https://api.deepseek.com",
          apiKey: "server-owned-key",
          model: "deepseek-chat"
        }
      },
      evidence: [],
      turns: [],
      diagnosis: {
        stage: "searching",
        failingStep: "run-opening-round",
        providerBaseUrl: "https://api.deepseek.com/v1",
        providerModel: "deepseek-chat",
        category: "offline",
        summary: "Malformed diagnosis",
        suggestedFix: "Ignore"
      }
    } satisfies SessionRecord;

    sessionStore.save(session);
    const continueSpy = vi
      .spyOn(runtime, "continueSession")
      .mockRejectedValue(new Error("OpenAI-compatible request failed with status 401"));

    try {
      const response = await continuePOST(
        new Request("http://localhost/api/session/malformed-diagnosis-session/continue", {
          method: "POST"
        }),
        { params: Promise.resolve({ sessionId: "malformed-diagnosis-session" }) }
      );

      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.error).toBe("OpenAI-compatible request failed with status 401");
      expect(payload.diagnosis).toBeUndefined();
    } finally {
      continueSpy.mockRestore();
    }
  });

  it("returns 404 for an unknown session id on stop", async () => {
    const response = await stopPOST(
      new Request("http://localhost/api/session/missing-session/stop", {
        method: "POST"
      }),
      { params: Promise.resolve({ sessionId: "missing-session" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBeDefined();
  });
});
