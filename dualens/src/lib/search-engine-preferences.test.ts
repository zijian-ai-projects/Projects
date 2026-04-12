import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadActiveSearchEngineRuntimeConfig,
  loadSearchEngineConfigs,
  loadSelectedSearchEngineId,
  saveSearchEngineConfig,
  saveSelectedSearchEngineId
} from "@/lib/search-engine-preferences";

describe("search-engine preferences", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("falls back to tavily when nothing has been saved", () => {
    expect(loadSelectedSearchEngineId()).toBe("tavily");
  });

  it("loads default search engine configs when nothing has been saved", () => {
    const configs = loadSearchEngineConfigs();

    expect(configs.tavily).toMatchObject({
      searchEngineId: "tavily",
      endpoint: "https://api.tavily.com/search"
    });
    expect(loadActiveSearchEngineRuntimeConfig()).toBeNull();
  });

  it("restores the saved engine id from localStorage", () => {
    saveSelectedSearchEngineId("google");

    expect(loadSelectedSearchEngineId()).toBe("google");
  });

  it("restores a complete saved runtime search configuration", () => {
    saveSelectedSearchEngineId("tavily");
    saveSearchEngineConfig("tavily", {
      searchEngineId: "tavily",
      apiKey: "client-tavily-key",
      engineIdentifier: "",
      endpoint: "https://api.tavily.com/search",
      extra: ""
    });

    expect(loadActiveSearchEngineRuntimeConfig()).toEqual({
      engineId: "tavily",
      apiKey: "client-tavily-key",
      endpoint: "https://api.tavily.com/search",
      engineIdentifier: undefined,
      extra: undefined
    });
  });

  it("ignores invalid saved values", () => {
    window.localStorage.setItem("dualens:selectedSearchEngineId", "duckduckgo");

    expect(loadSelectedSearchEngineId()).toBe("tavily");
  });

  it("falls back to tavily when storage reads fail", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadSelectedSearchEngineId()).toBe("tavily");
  });

  it("ignores storage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveSelectedSearchEngineId("google")).not.toThrow();
  });
});
