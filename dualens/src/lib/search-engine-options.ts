import type { SearchEngineId } from "@/lib/types";

export type { SearchEngineId };

export const searchEngineItems = [
  {
    id: "bing",
    name: "Bing",
    configured: false,
    icon: "B",
    endpoint: "https://api.bing.microsoft.com",
    helperText: {
      en: "Enter the Bing Search API key, custom config, or other required parameters.",
      "zh-CN": "填写 Bing Search API 的 Key、Custom Config 或其他必需参数。"
    }
  },
  {
    id: "baidu",
    name: "百度",
    configured: false,
    icon: "百",
    endpoint: "https://aip.baidubce.com",
    helperText: {
      en: "Enter Baidu search access parameters such as app id, secret key, and retrieval entry.",
      "zh-CN": "填写百度搜索接入参数，例如 App ID、Secret Key 与检索入口。"
    }
  },
  {
    id: "google",
    name: "Google",
    configured: false,
    icon: "G",
    endpoint: "https://customsearch.googleapis.com",
    helperText: {
      en: "Enter the Google Custom Search API key and search engine CX.",
      "zh-CN": "填写 Google Custom Search API Key 与搜索引擎 CX。"
    }
  },
  {
    id: "tavily",
    name: "Tavily",
    configured: true,
    icon: "T",
    endpoint: "https://api.tavily.com/search",
    helperText: {
      en: "Enter the Tavily API key and retrieval parameters for the current default search engine.",
      "zh-CN": "填写 Tavily API Key 与所需检索参数，作为当前默认搜索引擎。"
    }
  }
] as const;
