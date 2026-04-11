import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadActiveModelProviderDisplay,
  loadActiveModelProviderRuntimeConfig,
  loadModelProviderConfigs,
  saveModelProviderConfig,
  saveSelectedModelProviderId
} from "@/lib/model-provider-preferences";

describe("model provider preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to DeepSeek defaults when no provider has been saved", () => {
    const configs = loadModelProviderConfigs();

    expect(configs.deepseek).toMatchObject({
      providerId: "deepseek",
      modelId: "deepseek-chat",
      endpoint: "https://api.deepseek.com"
    });
    expect(loadActiveModelProviderDisplay()).toMatchObject({
      providerId: "deepseek",
      modelLabel: "deepseek-chat",
      configured: false
    });
    expect(loadActiveModelProviderRuntimeConfig()).toBeNull();
  });

  it("restores a saved selected provider and exposes runtime config only when complete", () => {
    saveSelectedModelProviderId("openai");
    saveModelProviderConfig("openai", {
      providerId: "openai",
      apiKey: "client-openai-key",
      modelId: "gpt-4.1",
      endpoint: "https://api.openai.com/v1",
      extra: "project=demo"
    });

    expect(loadActiveModelProviderDisplay()).toEqual({
      providerId: "openai",
      providerName: "OpenAI",
      modelLabel: "gpt-4.1",
      configured: true
    });
    expect(loadActiveModelProviderRuntimeConfig()).toEqual({
      baseUrl: "https://api.openai.com/v1",
      apiKey: "client-openai-key",
      model: "gpt-4.1"
    });
  });

  it("ignores malformed storage and keeps safe defaults", () => {
    window.localStorage.setItem("dualens:modelProviderConfigs", "{not-json");
    window.localStorage.setItem("dualens:selectedModelProviderId", "unknown");

    expect(loadActiveModelProviderDisplay()).toMatchObject({
      providerId: "deepseek",
      modelLabel: "deepseek-chat",
      configured: false
    });
  });

  it("ignores storage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveSelectedModelProviderId("gemini")).not.toThrow();
    expect(() =>
      saveModelProviderConfig("gemini", {
        providerId: "gemini",
        apiKey: "gemini-key",
        modelId: "gemini-2.5-pro",
        endpoint: "https://generativelanguage.googleapis.com",
        extra: ""
      })
    ).not.toThrow();
  });
});
