import {
  searchEngineItems,
  type SearchEngineId
} from "@/lib/search-engine-options";

const STORAGE_KEY = "dualens:selectedSearchEngineId";
const DEFAULT_ENGINE_ID: SearchEngineId = "tavily";
const validSearchEngineIds = new Set<SearchEngineId>(
  searchEngineItems.map((item) => item.id)
);

export function loadSelectedSearchEngineId(): SearchEngineId {
  if (typeof window === "undefined") {
    return DEFAULT_ENGINE_ID;
  }

  try {
    const savedValue = window.localStorage.getItem(STORAGE_KEY);

    return savedValue && validSearchEngineIds.has(savedValue as SearchEngineId)
      ? (savedValue as SearchEngineId)
      : DEFAULT_ENGINE_ID;
  } catch {
    return DEFAULT_ENGINE_ID;
  }
}

export function saveSelectedSearchEngineId(id: SearchEngineId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ignore storage write failures and keep the UI functional.
  }
}
