import { enUS } from "@/locales/en-US";
import { zhCN } from "@/locales/zh-CN";
import type { UiLanguage } from "@/lib/types";

export function getSiteCopy(language: UiLanguage) {
  return language === "en" ? enUS : zhCN;
}
