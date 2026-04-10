import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadSelectedSearchEngineId,
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

  it("restores the saved engine id from localStorage", () => {
    saveSelectedSearchEngineId("google");

    expect(loadSelectedSearchEngineId()).toBe("google");
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
