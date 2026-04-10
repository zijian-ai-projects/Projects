export type SearchEngineId = "bing" | "baidu" | "google" | "tavily";

export const searchEngineItems = [
  {
    id: "bing",
    name: "Bing",
    configured: false,
    icon: "B",
    endpoint: "https://api.bing.microsoft.com",
    helperText: "填写 Bing Search API 的 Key、Custom Config 或其他必需参数。"
  },
  {
    id: "baidu",
    name: "百度",
    configured: false,
    icon: "百",
    endpoint: "https://aip.baidubce.com",
    helperText: "填写百度搜索接入参数，例如 App ID、Secret Key 与检索入口。"
  },
  {
    id: "google",
    name: "Google",
    configured: false,
    icon: "G",
    endpoint: "https://customsearch.googleapis.com",
    helperText: "填写 Google Custom Search API Key 与搜索引擎 CX。"
  },
  {
    id: "tavily",
    name: "Tavily",
    configured: true,
    icon: "T",
    endpoint: "https://api.tavily.com/search",
    helperText: "填写 Tavily API Key 与所需检索参数，作为当前默认搜索引擎。"
  }
] as const;
