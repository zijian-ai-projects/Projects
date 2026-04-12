import { describe, expect, it, vi } from "vitest";
import { createSummaryService } from "@/server/debate/summary";
import { createOpenAICompatibleProvider } from "@/server/llm/openai-compatible-provider";
import { buildOpeningPrompt, buildSummaryPrompt } from "@/server/prompts";

describe("summary service", () => {
  it("includes the selected language, fixed identities, and mapped temperaments in the opening prompt", () => {
    const prompt = buildOpeningPrompt({
      question: "Should I move to another city?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      language: "zh-CN",
      evidence: [{ id: "e1" }],
      turns: []
    } as never);

    expect(prompt).toContain("zh-CN");
    expect(prompt).toContain("乾明");
    expect(prompt).toContain("坤察");
    expect(prompt).toContain("谨慎 / 激进");
    expect(prompt).toContain("谨慎");
    expect(prompt).toContain("激进");
  });

  it("includes evidence ids, titles, and summaries in the opening prompt", () => {
    const prompt = buildOpeningPrompt({
      question: "Should I move to another city?",
      presetSelection: {
        pairId: "cautious-aggressive",
        luminaTemperament: "cautious"
      },
      language: "en",
      evidence: [
        {
          id: "e1",
          title: "Housing market outlook",
          url: "https://example.com/housing",
          sourceName: "Example News",
          sourceType: "news",
          summary: "Prices have softened in the last quarter.",
          dataPoints: ["Inventory remains elevated"]
        }
      ],
      turns: []
    } as never);

    expect(prompt).toContain("e1");
    expect(prompt).toContain("Housing market outlook");
    expect(prompt).toContain("Prices have softened in the last quarter.");
    expect(prompt).toContain("Inventory remains elevated");
  });

  it("includes turns and evidence context in the summary prompt", () => {
    const prompt = buildSummaryPrompt({
      question: "Should I move to another city?",
      evidence: [
        {
          id: "e1",
          title: "Housing market outlook",
          url: "https://example.com/housing",
          sourceName: "Example News",
          sourceType: "news",
          summary: "Prices have softened in the last quarter."
        }
      ],
      turns: [
        {
          id: "t1",
          speaker: "Lumina",
          content: "Protect downside first.",
          referencedEvidenceIds: ["e1"]
        }
      ]
    } as never);

    expect(prompt).toContain("Protect downside first.");
    expect(prompt).toContain("e1");
    expect(prompt).toContain("Housing market outlook");
    expect(prompt).toContain("Prices have softened in the last quarter.");
  });

  it("returns a summary that references evidence ids", async () => {
    const service = createSummaryService({
      complete: async () => ({
        strongestFor: [{ text: "Keep cash runway in mind.", evidenceIds: ["e1"] }],
        strongestAgainst: [{ text: "Upside may justify the risk.", evidenceIds: ["e2"] }],
        coreDisagreement: "How much downside the user can absorb.",
        keyUncertainty: "Customer demand strength.",
        nextAction: "Validate demand before resigning."
      })
    });

    const summary = await service.generate({
      question: "Should I quit and build a startup?",
      evidence: [{ id: "e1" }, { id: "e2" }]
    } as never);

    expect(summary.strongestFor[0].evidenceIds).toContain("e1");
  });

  it("posts chat completion requests to a custom base url", async () => {
    const calls: Array<{ url: string }> = [];
    const provider = createOpenAICompatibleProvider<{
      coreDisagreement: string;
    }>({
      baseUrl: "https://example.com/v1",
      apiKey: "test-key",
      model: "gpt-4o-mini",
      fetch: async (url) => {
        calls.push({ url: String(url) });
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "{\"coreDisagreement\":\"x\"}" } }]
          }),
          { status: 200 }
        );
      }
    });

    await provider.complete([{ role: "user", content: "hello" }], "DebateSummary");
    expect(calls[0].url).toBe("https://example.com/v1/chat/completions");
  });

  it("throws a clear error when the model response omits message content", async () => {
    const provider = createOpenAICompatibleProvider<{
      coreDisagreement: string;
    }>({
      baseUrl: "https://example.com/v1",
      apiKey: "test-key",
      model: "gpt-4o-mini",
      fetch: async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: {} }]
          }),
          { status: 200 }
        )
    });

    await expect(provider.complete([{ role: "user", content: "hello" }], "DebateSummary")).rejects
      .toThrow("missing message content");
  });

  it("times out hanging chat completion requests", async () => {
    vi.useFakeTimers();
    try {
      const provider = createOpenAICompatibleProvider<{
        coreDisagreement: string;
      }>({
        baseUrl: "https://example.com/v1",
        apiKey: "test-key",
        model: "gpt-4o-mini",
        requestTimeoutMs: 10,
        fetch: async (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
            });
          })
      });

      const completion = provider.complete([{ role: "user", content: "hello" }], "DebateSummary");
      const handledCompletion = completion.catch((error) => error as Error);
      await vi.advanceTimersByTimeAsync(11);
      const error = await handledCompletion;

      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({ name: "AbortError" });
      expect(error.message).toContain("timed out");
    } finally {
      vi.useRealTimers();
    }
  });
});
