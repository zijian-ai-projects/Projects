import type { OpenAICompatibleProviderConfig } from "@/lib/types";

export type ModelProviderId = "deepseek" | "openai" | "gemini" | "doubao";

export type ModelProviderConfig = {
  providerId: ModelProviderId;
  apiKey: string;
  modelId: string;
  endpoint: string;
  extra: string;
};

export type ModelProviderOption = {
  id: ModelProviderId;
  name: string;
  icon: string;
  defaultModelId: string;
  defaultEndpoint: string;
  apiUrl: string;
  tutorialUrl: string;
};

export const SELECTED_MODEL_PROVIDER_STORAGE_KEY = "dualens:selectedModelProviderId";
export const MODEL_PROVIDER_CONFIGS_STORAGE_KEY = "dualens:modelProviderConfigs";

export const MODEL_PROVIDER_OPTIONS = [
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "D",
    defaultModelId: "deepseek-chat",
    defaultEndpoint: "https://api.deepseek.com",
    apiUrl: "https://platform.deepseek.com/api_keys",
    tutorialUrl: "https://api-docs.deepseek.com/"
  },
  {
    id: "doubao",
    name: "豆包",
    icon: "豆",
    defaultModelId: "",
    defaultEndpoint: "https://ark.cn-beijing.volces.com/api/v3",
    apiUrl: "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    tutorialUrl: "https://www.volcengine.com/docs/82379/2121998"
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "O",
    defaultModelId: "",
    defaultEndpoint: "https://api.openai.com/v1",
    apiUrl: "https://platform.openai.com/api-keys",
    tutorialUrl: "https://platform.openai.com/docs/quickstart"
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "G",
    defaultModelId: "",
    defaultEndpoint: "https://generativelanguage.googleapis.com",
    apiUrl: "https://aistudio.google.com/apikey",
    tutorialUrl: "https://ai.google.dev/gemini-api/docs/quickstart"
  }
] as const satisfies readonly ModelProviderOption[];

const DEFAULT_PROVIDER_ID: ModelProviderId = "deepseek";
const validProviderIds = new Set<ModelProviderId>(
  MODEL_PROVIDER_OPTIONS.map((item) => item.id)
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getProviderOption(providerId: ModelProviderId) {
  return (
    MODEL_PROVIDER_OPTIONS.find((item) => item.id === providerId) ??
    MODEL_PROVIDER_OPTIONS[0]
  );
}

export function createDefaultModelProviderConfig(
  providerId: ModelProviderId
): ModelProviderConfig {
  const option = getProviderOption(providerId);

  return {
    providerId,
    apiKey: "",
    modelId: option.defaultModelId,
    endpoint: option.defaultEndpoint,
    extra: ""
  };
}

function normalizeModelProviderConfig(
  providerId: ModelProviderId,
  value: unknown
): ModelProviderConfig {
  const fallback = createDefaultModelProviderConfig(providerId);

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    providerId,
    apiKey: readString(value.apiKey),
    modelId: readString(value.modelId) || fallback.modelId,
    endpoint: readString(value.endpoint) || fallback.endpoint,
    extra: readString(value.extra)
  };
}

function readStoredConfigs() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(MODEL_PROVIDER_CONFIGS_STORAGE_KEY);

    return rawValue ? (JSON.parse(rawValue) as unknown) : null;
  } catch {
    return null;
  }
}

export function loadSelectedModelProviderId(): ModelProviderId {
  if (typeof window === "undefined") {
    return DEFAULT_PROVIDER_ID;
  }

  try {
    const savedValue = window.localStorage.getItem(SELECTED_MODEL_PROVIDER_STORAGE_KEY);

    return savedValue && validProviderIds.has(savedValue as ModelProviderId)
      ? (savedValue as ModelProviderId)
      : DEFAULT_PROVIDER_ID;
  } catch {
    return DEFAULT_PROVIDER_ID;
  }
}

export function saveSelectedModelProviderId(providerId: ModelProviderId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SELECTED_MODEL_PROVIDER_STORAGE_KEY, providerId);
  } catch {
    // Keep the UI usable when browser storage is blocked.
  }
}

export function loadModelProviderConfigs(): Record<ModelProviderId, ModelProviderConfig> {
  const storedConfigs = readStoredConfigs();

  return MODEL_PROVIDER_OPTIONS.reduce(
    (configs, option) => ({
      ...configs,
      [option.id]: normalizeModelProviderConfig(
        option.id,
        isRecord(storedConfigs) ? storedConfigs[option.id] : null
      )
    }),
    {} as Record<ModelProviderId, ModelProviderConfig>
  );
}

export function saveModelProviderConfig(
  providerId: ModelProviderId,
  config: ModelProviderConfig
) {
  if (typeof window === "undefined") {
    return;
  }

  const nextConfigs = {
    ...loadModelProviderConfigs(),
    [providerId]: normalizeModelProviderConfig(providerId, config)
  };

  try {
    window.localStorage.setItem(MODEL_PROVIDER_CONFIGS_STORAGE_KEY, JSON.stringify(nextConfigs));
  } catch {
    // Keep the UI usable when browser storage is blocked.
  }
}

export function resetModelProviderConfig(providerId: ModelProviderId) {
  if (typeof window === "undefined") {
    return;
  }

  const nextConfigs = {
    ...loadModelProviderConfigs(),
    [providerId]: createDefaultModelProviderConfig(providerId)
  };

  try {
    window.localStorage.setItem(MODEL_PROVIDER_CONFIGS_STORAGE_KEY, JSON.stringify(nextConfigs));
  } catch {
    // Keep the UI usable when browser storage is blocked.
  }
}

export function isModelProviderConfigured(config: ModelProviderConfig) {
  return (
    config.apiKey.trim().length > 0 &&
    config.modelId.trim().length > 0 &&
    config.endpoint.trim().length > 0
  );
}

export function loadActiveModelProviderDisplay() {
  const providerId = loadSelectedModelProviderId();
  const config = loadModelProviderConfigs()[providerId];
  const option = getProviderOption(providerId);

  return {
    providerId,
    providerName: option.name,
    modelLabel: config.modelId || option.defaultModelId || option.name,
    configured: isModelProviderConfigured(config)
  };
}

export function loadActiveModelProviderRuntimeConfig(): OpenAICompatibleProviderConfig | null {
  const providerId = loadSelectedModelProviderId();
  const config = loadModelProviderConfigs()[providerId];

  if (!isModelProviderConfigured(config)) {
    return null;
  }

  return {
    baseUrl: config.endpoint,
    apiKey: config.apiKey,
    model: config.modelId
  };
}
