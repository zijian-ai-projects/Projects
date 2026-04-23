import type { SessionRecord } from "@/lib/types";
import { GET as sessionGET } from "@/app/api/session/[sessionId]/route";
import { POST } from "@/app/api/session/route";
import { POST as continuePOST } from "@/app/api/session/[sessionId]/continue/route";
import { POST as premisePOST } from "@/app/api/session/[sessionId]/premise/route";
import { POST as stopPOST } from "@/app/api/session/[sessionId]/stop/route";
import { runtime } from "@/server/runtime";
import {
  createSessionOwnerCookieValue,
  hashSessionOwnerToken,
  SESSION_OWNER_COOKIE_NAME
} from "@/server/session-auth";
import { createSessionStore } from "@/server/session-store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SERVER_DEEPSEEK_API_KEY = "server-owned-deepseek-key";
let createSessionRequestCounter = 0;

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
  createSessionRequestCounter += 1;
  const response = await POST(
    new Request("http://localhost/api/session", {
      method: "POST",
      headers: {
        "X-Forwarded-For": `198.51.100.${createSessionRequestCounter}`
      },
      body: JSON.stringify(createSessionBody())
    })
  );
  const payload = (await response.json()) as { id: string };
  const ownerCookie = response.headers
    .get("set-cookie")
    ?.split(";")
    .find((part) => part.trim().startsWith(`${SESSION_OWNER_COOKIE_NAME}=`))
    ?.trim();

  return {
    ...payload,
    ownerCookie
  };
}

function getRequiredOwnerCookie(session: { ownerCookie?: string }) {
  expect(session.ownerCookie).toEqual(expect.stringContaining(`${SESSION_OWNER_COOKIE_NAME}=`));
  return session.ownerCookie as string;
}

function createOwnerCookieForSession(sessionId: string, ownerToken: string) {
  return `${SESSION_OWNER_COOKIE_NAME}=${createSessionOwnerCookieValue(sessionId, ownerToken)}`;
}

function createSessionRequest(
  path: string,
  session: { id: string; ownerCookie?: string },
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers);
  if (session.ownerCookie) {
    headers.set("Cookie", session.ownerCookie);
  }

  return new Request(`http://localhost/api/session/${session.id}${path}`, {
    ...init,
    headers
  });
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
    expect(response.headers.get("set-cookie")).toContain(`${SESSION_OWNER_COOKIE_NAME}=`);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
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

  it("accepts a selected provider config and never returns its API key", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", undefined);
    vi.stubEnv("OPENAI_API_KEY", undefined);
    vi.stubEnv("api_key", undefined);

    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify(
          createSessionBody({
            model: "gpt-4.1",
            providerConfig: {
              baseUrl: "https://api.openai.com/v1",
              apiKey: "client-openai-key",
              model: "gpt-4.1"
            }
          })
        )
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.config.provider).toEqual({
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1"
    });
  });

  it("rejects provider base URLs outside the server allowlist", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify(
          createSessionBody({
            providerConfig: {
              baseUrl: "http://127.0.0.1:11434/v1",
              apiKey: "client-key",
              model: "local-model"
            }
          })
        )
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
  });

  it("rejects search endpoints outside the server allowlist", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify(
          createSessionBody({
            searchConfig: {
              engineId: "tavily",
              apiKey: "client-tavily-key",
              endpoint: "https://attacker.example/search"
            }
          })
        )
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
  });

  it("rejects excessive round counts before starting a runner", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify(
          createSessionBody({
            config: {
              roundCount: 10_000
            }
          })
        )
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
  });

  it("blocks anonymous production session creation unless explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DUALENS_ALLOW_ANONYMOUS_SESSIONS", undefined);
    vi.stubEnv("DUALENS_SESSION_API_TOKEN", undefined);

    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify(createSessionBody())
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBeDefined();
  });

  it("rate limits repeated anonymous session creation by client IP", async () => {
    vi.stubEnv("DUALENS_SESSION_RATE_LIMIT_MAX", "1");
    const clientHeaders = {
      "X-Forwarded-For": "198.51.100.23"
    };

    const firstResponse = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        headers: clientHeaders,
        body: JSON.stringify(createSessionBody())
      })
    );
    const secondResponse = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        headers: clientHeaders,
        body: JSON.stringify(createSessionBody())
      })
    );

    const payload = await secondResponse.json();

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(429);
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
      createSessionRequest("/premise", session, {
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
      createSessionRequest("/premise", session, {
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
      createSessionRequest("", created, {
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
    const ownerToken = "persisted-diagnosis-owner-token";
    const session = {
      id: "persisted-diagnosis-session",
      ownerTokenHash: hashSessionOwnerToken(ownerToken),
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
          method: "POST",
          headers: {
            Cookie: createOwnerCookieForSession("persisted-diagnosis-session", ownerToken)
          }
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
    const ownerToken = "malformed-diagnosis-owner-token";
    const session = {
      id: "malformed-diagnosis-session",
      ownerTokenHash: hashSessionOwnerToken(ownerToken),
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
          method: "POST",
          headers: {
            Cookie: createOwnerCookieForSession("malformed-diagnosis-session", ownerToken)
          }
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

  it.each([
    ["GET /api/session/{sessionId}", "GET", ""] as const,
    ["POST /api/session/{sessionId}/continue", "POST", "/continue"] as const,
    ["POST /api/session/{sessionId}/premise", "POST", "/premise"] as const,
    ["POST /api/session/{sessionId}/stop", "POST", "/stop"] as const
  ])("rejects missing owner credentials for %s", async (_label, method, path) => {
    const session = await createSession();
    const response = path === ""
      ? await sessionGET(
          new Request(`http://localhost/api/session/${session.id}`, { method }),
          { params: Promise.resolve({ sessionId: session.id }) }
        )
      : path === "/continue"
        ? await continuePOST(
            new Request(`http://localhost/api/session/${session.id}${path}`, { method }),
            { params: Promise.resolve({ sessionId: session.id }) }
          )
        : path === "/premise"
          ? await premisePOST(
              new Request(`http://localhost/api/session/${session.id}${path}`, {
                method,
                body: JSON.stringify({ premise: "owner check" })
              }),
              { params: Promise.resolve({ sessionId: session.id }) }
            )
          : await stopPOST(
              new Request(`http://localhost/api/session/${session.id}${path}`, { method }),
              { params: Promise.resolve({ sessionId: session.id }) }
            );

    expect(response.status).toBe(401);
  });

  it.each([
    ["GET /api/session/{sessionId}", "GET", ""] as const,
    ["POST /api/session/{sessionId}/continue", "POST", "/continue"] as const,
    ["POST /api/session/{sessionId}/premise", "POST", "/premise"] as const,
    ["POST /api/session/{sessionId}/stop", "POST", "/stop"] as const
  ])("rejects wrong owner credentials for %s", async (_label, method, path) => {
    const session = await createSession();
    const otherSession = await createSession();
    const wrongOwnerCookie = getRequiredOwnerCookie(otherSession);
    const request = new Request(`http://localhost/api/session/${session.id}${path}`, {
      method,
      headers: {
        Cookie: wrongOwnerCookie
      },
      ...(path === "/premise" ? { body: JSON.stringify({ premise: "owner check" }) } : {})
    });
    const context = { params: Promise.resolve({ sessionId: session.id }) };
    const response = path === ""
      ? await sessionGET(request, context)
      : path === "/continue"
        ? await continuePOST(request, context)
        : path === "/premise"
          ? await premisePOST(request, context)
          : await stopPOST(request, context);

    expect(response.status).toBe(403);
  });

  it.each([
    ["GET /api/session/{sessionId}", "GET", ""] as const,
    ["POST /api/session/{sessionId}/continue", "POST", "/continue"] as const,
    ["POST /api/session/{sessionId}/premise", "POST", "/premise"] as const,
    ["POST /api/session/{sessionId}/stop", "POST", "/stop"] as const
  ])("allows correct owner credentials for %s", async (_label, method, path) => {
    const session = await createSession();
    const ownerCookie = getRequiredOwnerCookie(session);
    const request = new Request(`http://localhost/api/session/${session.id}${path}`, {
      method,
      headers: {
        Cookie: ownerCookie
      },
      ...(path === "/premise" ? { body: JSON.stringify({ premise: "owner check" }) } : {})
    });
    const context = { params: Promise.resolve({ sessionId: session.id }) };
    const response = path === ""
      ? await sessionGET(request, context)
      : path === "/continue"
        ? await continuePOST(request, context)
        : path === "/premise"
          ? await premisePOST(request, context)
          : await stopPOST(request, context);

    expect(response.status).toBeLessThan(400);
  });
});
