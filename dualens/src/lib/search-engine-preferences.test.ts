import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSelectedSearchEngineId,
  saveSelectedSearchEngineId
} from "@/lib/search-engine-preferences";

describe("search-engine preferences", () => {
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
});
