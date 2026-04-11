import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runtime } from "@/server/runtime";

const SERVER_DEEPSEEK_API_KEY = "server-owned-deepseek-key";

function createOpenAIResponse(schemaName = "DebateTurn") {
  const content =
    schemaName === "DebateTurnAnalysis"
      ? {
          factualIssues: [],
          logicalIssues: [],
          valueIssues: [],
          searchFocus: "general follow-up"
        }
      : schemaName === "DebateSummary"
        ? {
            strongestFor: [],
            strongestAgainst: [],
            coreDisagreement: "Disagreement.",
            keyUncertainty: "Uncertainty.",
            nextAction: "Next."
          }
        : {
            speaker: "Lumina",
            content: "Argument",
            referencedEvidenceIds: []
          };

  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify(content)
          }
        }
      ]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function createSessionInput(overrides: Record<string, unknown> = {}) {
  return {
    question: "Should I move to another city for work?",
    presetSelection: {
      pairId: "cautious-aggressive",
      luminaTemperament: "cautious"
    },
    language: "en",
    model: "deepseek-chat",
    ...overrides
  };
}

beforeEach(() => {
  vi.stubEnv("DEEPSEEK_API_KEY", SERVER_DEEPSEEK_API_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("runtime speaker titles", () => {
  it("respects firstSpeaker when creating opening and debate turns", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(createSessionInput({ firstSpeaker: "vigila" }));

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    const turnCalls = fetchMock.mock.calls.filter((call) => {
      const body = JSON.parse(String(call[1]?.body ?? "{}"));
      return body?.metadata?.schemaName === "DebateTurn";
    });

    expect(turnCalls).toHaveLength(4);

    const firstBody = JSON.parse(String(turnCalls[0]?.[1]?.body));
    const secondBody = JSON.parse(String(turnCalls[1]?.[1]?.body));
    const thirdBody = JSON.parse(String(turnCalls[2]?.[1]?.body));
    const fourthBody = JSON.parse(String(turnCalls[3]?.[1]?.body));

    expect(firstBody.messages[0].content).toContain("Vigila");
    expect(secondBody.messages[0].content).toContain("Lumina");
    expect(thirdBody.messages[0].content).toContain("Vigila");
    expect(fourthBody.messages[0].content).toContain("Lumina");

    fetchMock.mockRestore();
  });

  it("assigns ids to generated turns before returning them to the client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(createSessionInput({ firstSpeaker: "vigila" }));
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    const debated = await runtime.continueSession(session.id);

    expect(debated.turns).toHaveLength(2);
    expect(debated.turns[0]?.id).toEqual(expect.any(String));
    expect(debated.turns[1]?.id).toEqual(expect.any(String));
    expect(debated.turns[0]?.id).not.toBe(debated.turns[1]?.id);

    fetchMock.mockRestore();
  });

  it("passes prior turns into later generation so agents can rebut with evidence", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      const schemaName = body?.metadata?.schemaName;
      if (schemaName !== "DebateTurn") {
        return createOpenAIResponse(schemaName);
      }

      const prompt = String(body?.messages?.[0]?.content ?? "");
      const speaker = prompt.includes("Speaker: Lumina") ? "Lumina" : "Vigila";

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  speaker,
                  content:
                    speaker === "Lumina"
                      ? "Protect downside first."
                      : "The rent data does not justify staying put.",
                  referencedEvidenceIds: ["e1"]
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const session = await runtime.createSession(createSessionInput());

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    const turnCalls = fetchMock.mock.calls.filter((call) => {
      const body = JSON.parse(String(call[1]?.body ?? "{}"));
      return body?.metadata?.schemaName === "DebateTurn";
    });
    const secondBody = JSON.parse(String(turnCalls[1]?.[1]?.body));
    expect(secondBody.messages[0].content).toContain("Debate context:");
    expect(secondBody.messages[0].content).toContain("Protect downside first.");
    expect(secondBody.messages[0].content).toContain("evidenceIds=e1");

    fetchMock.mockRestore();
  });

  it("adds analysis before follow-up turns in shared-evidence mode", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      const schemaName = body?.metadata?.schemaName;

      if (schemaName === "DebateTurnAnalysis") {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    factualIssues: ["Rent claim needs data."],
                    logicalIssues: [],
                    valueIssues: [],
                    searchFocus: "rent data"
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return createOpenAIResponse(schemaName);
    });

    const session = await runtime.createSession(createSessionInput());

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    const debated = await runtime.continueSession(session.id);

    expect(debated.turns[1]?.analysis?.factualIssues).toContain("Rent claim needs data.");

    fetchMock.mockRestore();
  });

  it("runs private-evidence mode as three rounds with side-specific evidence pools", async () => {
    const prompts: string[] = [];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      const prompt = String(body?.messages?.[0]?.content ?? "");
      const schemaName = body?.metadata?.schemaName;

      prompts.push(prompt);

      if (schemaName === "DebateTurnAnalysis") {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    factualIssues: [],
                    logicalIssues: ["Causality needs checking."],
                    valueIssues: [],
                    searchFocus: "private follow-up evidence"
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (schemaName === "DebateSummary") {
        return createOpenAIResponse(schemaName);
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  speaker: prompt.includes("Speaker: Lumina") ? "Lumina" : "Vigila",
                  content: "Private-mode argument.",
                  referencedEvidenceIds: []
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    let session = await runtime.createSession(
      createSessionInput({
        config: { debateMode: "private-evidence" }
      })
    );

    while (session.stage !== "complete") {
      session = await runtime.continueSession(session.id);
    }

    expect(session.debateMode).toBe("private-evidence");
    expect(session.turns).toHaveLength(6);
    expect(session.turns.map((turn) => turn.round)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(session.privateEvidence?.lumina?.length).toBeGreaterThan(0);
    expect(session.privateEvidence?.vigila?.length).toBeGreaterThan(0);

    const luminaPrompt = prompts.find(
      (prompt) => prompt.includes("Speaker: Lumina") && prompt.includes("Evidence context:")
    );
    expect(luminaPrompt).not.toContain("Vigila private");

    fetchMock.mockRestore();
  });
});

describe("runtime built-in model mapping", () => {
  it("maps a built-in model to fixed DeepSeek runtime config when creating a session", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(createSessionInput({ model: "deepseek-reasoner" }));

    expect(session.config.provider).toMatchObject({
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-reasoner"
    });
    expect(session.config.provider).not.toHaveProperty("apiKey");

    fetchMock.mockRestore();
  });

  it("falls back to generic OpenAI-compatible provider environment variables", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", undefined);
    vi.stubEnv("OPENAI_API_KEY", "fallback-openai-key");
    vi.stubEnv("OPENAI_BASE_URL", "https://gateway.example/v1");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(createSessionInput());

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    const providerCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/chat/completions")
    );

    expect(session.config.provider).toMatchObject({
      baseUrl: "https://gateway.example/v1",
      model: "deepseek-chat"
    });
    expect(providerCalls).toHaveLength(3);
    expect(providerCalls.map((call) => String(call[0]))).toEqual([
      "https://gateway.example/v1/chat/completions",
      "https://gateway.example/v1/chat/completions",
      "https://gateway.example/v1/chat/completions"
    ]);

    fetchMock.mockRestore();
  });

  it("uses a client-provided provider config and redacts the API key from returned sessions", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", undefined);
    vi.stubEnv("OPENAI_API_KEY", undefined);
    vi.stubEnv("api_key", undefined);

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(
      createSessionInput({
        model: "gpt-4.1",
        providerConfig: {
          baseUrl: "https://gateway.example/v1",
          apiKey: "client-openai-key",
          model: "gpt-4.1"
        }
      })
    );

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    const providerCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/chat/completions")
    );

    expect(session.config.provider).toMatchObject({
      baseUrl: "https://gateway.example/v1",
      model: "gpt-4.1"
    });
    expect(session.config.provider).not.toHaveProperty("apiKey");
    expect(providerCalls.map((call) => String(call[0]))).toEqual([
      "https://gateway.example/v1/chat/completions",
      "https://gateway.example/v1/chat/completions",
      "https://gateway.example/v1/chat/completions"
    ]);
    expect(providerCalls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer client-openai-key"
    });

    fetchMock.mockRestore();
  });

  it("supports lowercase base_url and api_key environment variables", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", undefined);
    vi.stubEnv("OPENAI_API_KEY", undefined);
    vi.stubEnv("OPENAI_BASE_URL", undefined);
    vi.stubEnv("api_key", "lowercase-key");
    vi.stubEnv("base_url", "https://lowercase.example/v1");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(createSessionInput());

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    const providerCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/chat/completions")
    );

    expect(session.config.provider).toMatchObject({
      baseUrl: "https://lowercase.example/v1",
      model: "deepseek-chat"
    });
    expect(providerCalls.map((call) => String(call[0]))).toEqual([
      "https://lowercase.example/v1/chat/completions",
      "https://lowercase.example/v1/chat/completions",
      "https://lowercase.example/v1/chat/completions"
    ]);

    fetchMock.mockRestore();
  });

  it("requires an API key from supported provider environment variables", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", undefined);
    vi.stubEnv("OPENAI_API_KEY", undefined);
    vi.stubEnv("api_key", undefined);

    await expect(runtime.createSession(createSessionInput())).rejects.toThrow(/API key/i);
  });

  it("uses Tavily search when TAVILY_API_KEY is configured", async () => {
    vi.stubEnv("TAVILY_API_KEY", "tavily-key");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://api.tavily.com/search") {
        return new Response(
          JSON.stringify({
            results: [
              {
                title: "Housing report",
                url: "https://example.com/housing"
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url === "https://example.com/housing") {
        return new Response(
          "<html><head><meta name=\"description\" content=\"Median rent rose 8%.\" /></head><body><p>Median rent rose 8%.</p></body></html>",
          {
          status: 200,
          headers: { "Content-Type": "text/html" }
          }
        );
      }

      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  speaker: body?.messages?.[0]?.content?.includes("Speaker: Lumina") ? "Lumina" : "Vigila",
                  content: "Argument",
                  referencedEvidenceIds: []
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const session = await runtime.createSession(createSessionInput());
    const researched = await runtime.continueSession(session.id);

    expect(researched.evidence).toHaveLength(1);
    expect(fetchMock.mock.calls.some((call) => String(call[0]) === "https://api.tavily.com/search")).toBe(true);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("duckduckgo.com"))).toBe(false);

    fetchMock.mockRestore();
  });

  it("uses a client-provided Tavily search config instead of DuckDuckGo search", async () => {
    vi.stubEnv("TAVILY_API_KEY", undefined);

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://api.tavily.com/search") {
        return new Response(
          JSON.stringify({
            results: [
              {
                title: "Housing report",
                url: "https://example.com/housing",
                content: "Median rent rose 8%."
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url === "https://example.com/housing") {
        return new Response(
          "<html><head><meta name=\"description\" content=\"Median rent rose 8%.\" /></head><body><p>Median rent rose 8%.</p></body></html>",
          { status: 200, headers: { "Content-Type": "text/html" } }
        );
      }

      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(
      createSessionInput({
        searchConfig: {
          engineId: "tavily",
          apiKey: "client-tavily-key",
          endpoint: "https://api.tavily.com/search"
        }
      })
    );
    const researched = await runtime.continueSession(session.id);

    const tavilyRequest = fetchMock.mock.calls.find(
      (call) => String(call[0]) === "https://api.tavily.com/search"
    );
    const tavilyBody = JSON.parse(String(tavilyRequest?.[1]?.body));

    expect(researched.evidence).toHaveLength(1);
    expect(tavilyBody.api_key).toBe("client-tavily-key");
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("duckduckgo.com"))).toBe(false);

    fetchMock.mockRestore();
  });
});

describe("runtime session cloning", () => {
  it("returns cloned sessions so caller mutation does not leak back into storage", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(createSessionInput());

    session.config.provider.baseUrl = "https://mutated.example/v1";

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    const providerCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/chat/completions")
    );

    expect(providerCalls).toHaveLength(3);
    expect(providerCalls.map((call) => String(call[0]))).toEqual([
      "https://api.deepseek.com/chat/completions",
      "https://api.deepseek.com/chat/completions",
      "https://api.deepseek.com/chat/completions"
    ]);

    fetchMock.mockRestore();
  });
});
describe("runtime diagnostics", () => {
  it("persists structured diagnostics for research failures", async () => {
    vi.stubEnv("TAVILY_API_KEY", "tavily-key");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://api.tavily.com/search") {
        throw new TypeError("fetch failed");
      }

      const body = JSON.parse(String(init?.body ?? "{}"));
      return createOpenAIResponse(body?.metadata?.schemaName);
    });

    const session = await runtime.createSession(createSessionInput());

    await expect(runtime.continueSession(session.id)).rejects.toThrow("fetch failed");

    const stopped = await runtime.stopSession(session.id);

    expect(stopped.diagnosis).toMatchObject({
      stage: "research",
      failingStep: "run-shared-research",
      providerBaseUrl: "https://api.tavily.com/search",
      providerModel: "tavily",
      category: "network"
    });
    expect(stopped.diagnosis?.summary).toContain("reach");

    fetchMock.mockRestore();
  });

  it("preserves structured diagnostics for opening failures", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    );

    const session = await runtime.createSession(createSessionInput());

    await runtime.continueSession(session.id);

    await expect(runtime.continueSession(session.id)).rejects.toThrow(
      "OpenAI-compatible request failed with status 401"
    );

    const stopped = await runtime.stopSession(session.id);

    expect(stopped.diagnosis).toMatchObject({
      stage: "opening",
      failingStep: "run-opening-round",
      providerBaseUrl: "https://api.deepseek.com",
      providerModel: "deepseek-chat",
      category: "auth"
    });
    expect(stopped.diagnosis?.summary).toContain("Authentication");
    expect(stopped.diagnosis?.suggestedFix).toContain("API key");

    fetchMock.mockRestore();
  });

  it("preserves structured diagnostics for summary failures", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const schemaName = body?.metadata?.schemaName;

      if (schemaName === "DebateSummary") {
        return new Response("{}", {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (schemaName === "DebateTurnAnalysis") {
        return createOpenAIResponse(schemaName);
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  speaker: "Lumina",
                  content: "Protect downside first.",
                  referencedEvidenceIds: ["e1"]
                })
              }
            }
          ]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });

    const session = await runtime.createSession({
      ...createSessionInput({
        config: {
          roundCount: 1
        }
      })
    });

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    await expect(runtime.continueSession(session.id)).rejects.toThrow(
      "OpenAI-compatible request failed with status 401"
    );

    const stopped = await runtime.stopSession(session.id);

    expect(stopped.diagnosis).toMatchObject({
      stage: "debate",
      failingStep: "run-summary",
      providerBaseUrl: "https://api.deepseek.com",
      providerModel: "deepseek-chat",
      category: "auth"
    });
    expect(stopped.diagnosis?.summary).toContain("Authentication");

    fetchMock.mockRestore();
  });

  it("classifies private-mode turn failures as debate failures before six turns", async () => {
    let debateTurnCount = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      const schemaName = body?.metadata?.schemaName;

      if (schemaName === "DebateTurnAnalysis") {
        return createOpenAIResponse(schemaName);
      }

      if (schemaName === "DebateTurn") {
        debateTurnCount += 1;

        if (debateTurnCount === 3) {
          return new Response("{}", {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return createOpenAIResponse(schemaName);
    });

    const session = await runtime.createSession(
      createSessionInput({
        config: {
          debateMode: "private-evidence",
          roundCount: 1
        }
      })
    );

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    await expect(runtime.continueSession(session.id)).rejects.toThrow(
      "OpenAI-compatible request failed with status 401"
    );

    const stopped = await runtime.stopSession(session.id);

    expect(stopped.diagnosis).toMatchObject({
      stage: "debate",
      failingStep: "run-debate-round"
    });

    fetchMock.mockRestore();
  });

  it("keeps the debate moving when additional Tavily research fails mid-round", async () => {
    vi.stubEnv("TAVILY_API_KEY", "tavily-key");

    let tavilySearchCount = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://api.tavily.com/search") {
        tavilySearchCount += 1;

        if (tavilySearchCount === 1) {
          return new Response(JSON.stringify({ results: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ error: "bad request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = JSON.parse(String(init?.body));
      const schemaName = body?.metadata?.schemaName;
      if (schemaName === "DebateTurnAnalysis") {
        return createOpenAIResponse(schemaName);
      }

      const prompt = String(body?.messages?.[0]?.content ?? "");
      const speaker = prompt.includes("Speaker: Lumina") ? "Lumina" : "Vigila";

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  speaker,
                  content: `${speaker} continues the debate.`,
                  referencedEvidenceIds: []
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const session = await runtime.createSession(createSessionInput());

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    const debated = await runtime.continueSession(session.id);

    expect(debated.stage).toBe("debate");
    expect(debated.turns).toHaveLength(3);
    expect(debated.turns[2]).toMatchObject({
      speaker: expect.any(String),
      content: expect.stringContaining("continues the debate")
    });
    expect(debated.diagnosis).toBeUndefined();

    fetchMock.mockRestore();
  });

  it("searches for additional evidence using the latest debate claims in later rounds", async () => {
    vi.stubEnv("TAVILY_API_KEY", "tavily-key");

    const tavilyQueries: string[] = [];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://api.tavily.com/search") {
        const body = JSON.parse(String(init?.body));
        tavilyQueries.push(String(body.query));

        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = JSON.parse(String(init?.body));
      const schemaName = body?.metadata?.schemaName;
      if (schemaName === "DebateTurnAnalysis") {
        return createOpenAIResponse(schemaName);
      }

      const prompt = String(body?.messages?.[0]?.content ?? "");
      const speaker = prompt.includes("Speaker: Lumina") ? "Lumina" : "Vigila";

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  speaker,
                  content:
                    speaker === "Lumina"
                      ? "The housing cost risk is still real."
                      : "Salary upside can offset the move if the data supports it.",
                  referencedEvidenceIds: []
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const session = await runtime.createSession(createSessionInput());

    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);
    await runtime.continueSession(session.id);

    expect(tavilyQueries).toHaveLength(3);
    expect(tavilyQueries[2]).toContain("Latest claim to verify:");
    expect(tavilyQueries[2]).toContain("Salary upside can offset the move if the data supports it.");
    expect(tavilyQueries[2]).toContain("support or challenge");

    fetchMock.mockRestore();
  });

  it("creates a Chinese stopped summary for Chinese sessions", async () => {
    const session = await runtime.createSession(createSessionInput({ language: "zh-CN" }));
    const stopped = await runtime.stopSession(session.id);

    expect(stopped.summary?.coreDisagreement).toContain("被手动停止");
    expect(stopped.summary?.keyUncertainty).toContain("当前问题仍未解决");
    expect(stopped.summary?.nextAction).toContain("继续");
  });
});
