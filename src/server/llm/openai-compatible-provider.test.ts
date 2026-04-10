import { describe, expect, it } from "vitest";
import { classifyProviderError } from "@/server/diagnostics/error-classifier";

describe("classifyProviderError", () => {
  it("maps a 401 provider failure to auth diagnostics", () => {
    const result = classifyProviderError(
      new Error("OpenAI-compatible request failed with status 401"),
      {
        stage: "opening",
        step: "run-opening-round",
        baseUrl: "https://api.deepseek.com/v1",
        model: "deepseek-chat"
      }
    );

    expect(result).toMatchObject({
      category: "auth",
      stage: "opening",
      failingStep: "run-opening-round",
      providerBaseUrl: "https://api.deepseek.com/v1",
      providerModel: "deepseek-chat"
    });
    expect(result.suggestedFix).toContain("API key");
  });

  it.each([
    [
      "unknown",
      new Error("OpenAI-compatible request failed with status 404")
    ],
    [
      "model",
      new Error("OpenAI-compatible request failed with status 404 while resolving model deployment")
    ],
    [
      "endpoint-shape",
      new Error("OpenAI-compatible response for opening turn was missing message content")
    ],
    [
      "endpoint-shape",
      new Error("Model response for opening turn was not valid JSON")
    ],
    [
      "endpoint-shape",
      new Error("OpenAI-compatible response for opening turn was not a valid object")
    ],
    [
      "network",
      new TypeError("fetch failed")
    ],
    [
      "timeout",
      Object.assign(new Error("The operation was aborted due to timeout"), {
        name: "AbortError"
      })
    ],
    [
      "unknown",
      new Error("something unexpected happened")
    ]
  ])("maps %s failures to stable diagnostics", (category, error) => {
    const result = classifyProviderError(error, {
      stage: "debate",
      step: "run-debate-round",
      baseUrl: "https://example.com/v1",
      model: "demo-model"
    });

    expect(result.category).toBe(category);
    expect(result.stage).toBe("debate");
    expect(result.failingStep).toBe("run-debate-round");
    expect(result.providerBaseUrl).toBe("https://example.com/v1");
    expect(result.providerModel).toBe("demo-model");
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.suggestedFix.length).toBeGreaterThan(0);
  });
});
