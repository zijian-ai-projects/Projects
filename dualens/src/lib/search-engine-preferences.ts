import {
  searchEngineItems,
  type SearchEngineId
} from "@/lib/search-engine-options";
import type { SearchEngineRuntimeConfig } from "@/lib/types";

const STORAGE_KEY = "dualens:selectedSearchEngineId";
const CONFIGS_STORAGE_KEY = "dualens:searchEngineConfigs";
const DEFAULT_ENGINE_ID: SearchEngineId = "tavily";
const validSearchEngineIds = new Set<SearchEngineId>(
  searchEngineItems.map((item) => item.id)
);

export type SearchEngineConfig = {
  searchEngineId: SearchEngineId;
  apiKey: string;
  engineIdentifier: string;
  endpoint: string;
  extra: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSearchEngineItem(id: SearchEngineId) {
  return searchEngineItems.find((item) => item.id === id) ?? searchEngineItems[0];
}

export function createDefaultSearchEngineConfig(id: SearchEngineId): SearchEngineConfig {
  const engine = getSearchEngineItem(id);

  return {
    searchEngineId: id,
    apiKey: "",
    engineIdentifier: "",
    endpoint: engine.endpoint,
    extra: ""
  };
}

function normalizeSearchEngineConfig(
  id: SearchEngineId,
  value: unknown
): SearchEngineConfig {
  const fallback = createDefaultSearchEngineConfig(id);

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    searchEngineId: id,
    apiKey: readString(value.apiKey),
    engineIdentifier: readString(value.engineIdentifier),
    endpoint: readString(value.endpoint) || fallback.endpoint,
    extra: readString(value.extra)
  };
}

function readStoredConfigs() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(CONFIGS_STORAGE_KEY);

    return rawValue ? (JSON.parse(rawValue) as unknown) : null;
  } catch {
    return null;
  }
}

export function createDefaultSearchEngineConfigs(): Record<SearchEngineId, SearchEngineConfig> {
  return searchEngineItems.reduce(
    (configs, item) => ({
      ...configs,
      [item.id]: createDefaultSearchEngineConfig(item.id)
    }),
    {} as Record<SearchEngineId, SearchEngineConfig>
  );
}

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

export function loadSearchEngineConfigs(): Record<SearchEngineId, SearchEngineConfig> {
  const storedConfigs = readStoredConfigs();

  return searchEngineItems.reduce(
    (configs, item) => ({
      ...configs,
      [item.id]: normalizeSearchEngineConfig(
        item.id,
        isRecord(storedConfigs) ? storedConfigs[item.id] : null
      )
    }),
    {} as Record<SearchEngineId, SearchEngineConfig>
  );
}

export function saveSearchEngineConfig(
  id: SearchEngineId,
  config: SearchEngineConfig
) {
  if (typeof window === "undefined") {
    return;
  }

  const nextConfigs = {
    ...loadSearchEngineConfigs(),
    [id]: normalizeSearchEngineConfig(id, config)
  };

  try {
    window.localStorage.setItem(CONFIGS_STORAGE_KEY, JSON.stringify(nextConfigs));
  } catch {
    // Ignore storage write failures and keep the UI functional.
  }
}

export function resetSearchEngineConfig(id: SearchEngineId) {
  if (typeof window === "undefined") {
    return;
  }

  const nextConfigs = {
    ...loadSearchEngineConfigs(),
    [id]: createDefaultSearchEngineConfig(id)
  };

  try {
    window.localStorage.setItem(CONFIGS_STORAGE_KEY, JSON.stringify(nextConfigs));
  } catch {
    // Ignore storage write failures and keep the UI functional.
  }
}

export function isSearchEngineConfigured(config: SearchEngineConfig) {
  return config.apiKey.trim().length > 0 && config.endpoint.trim().length > 0;
}

export function loadActiveSearchEngineRuntimeConfig(): SearchEngineRuntimeConfig | null {
  const selectedId = loadSelectedSearchEngineId();
  const config = loadSearchEngineConfigs()[selectedId];

  if (!isSearchEngineConfigured(config)) {
    return null;
  }

  return {
    engineId: selectedId,
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    engineIdentifier: config.engineIdentifier || undefined,
    extra: config.extra || undefined
  };
}

export function loadSelectedSearchEngineLabel() {
  const selectedId = loadSelectedSearchEngineId();

  return searchEngineItems.find((item) => item.id === selectedId)?.name ?? "Tavily";
}

export function loadActiveSearchEngineDisplay() {
  const selectedId = loadSelectedSearchEngineId();
  const config = loadSearchEngineConfigs()[selectedId];
  const item = getSearchEngineItem(selectedId);

  return {
    engineId: selectedId,
    engineName: item.name,
    configured: isSearchEngineConfigured(config)
  };
}
