"use client";

import { useAppPreferences } from "@/lib/app-preferences";
import { getSiteCopy } from "@/locales/site-copy";

export function LanguageSwitcher() {
  const { language, setLanguage } = useAppPreferences();
  const copy = getSiteCopy(language);

  return (
    <div
      aria-label={copy.topbar.languageLabel}
      className="inline-flex h-10 items-center rounded-[8px] border border-app-line bg-app-panel/82 p-1 shadow-app-soft backdrop-blur"
      role="group"
    >
      <button
        type="button"
        aria-pressed={language === "zh-CN"}
        className={[
          "inline-flex h-8 items-center justify-center rounded-[7px] px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
          language === "zh-CN"
            ? "bg-app-strong text-app-inverse"
            : "text-app-muted hover:bg-app-soft hover:text-app-strong"
        ].join(" ")}
        onClick={() => setLanguage("zh-CN")}
      >
        中文
      </button>
      <button
        type="button"
        aria-pressed={language === "en"}
        className={[
          "inline-flex h-8 items-center justify-center rounded-[7px] px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
          language === "en"
            ? "bg-app-strong text-app-inverse"
            : "text-app-muted hover:bg-app-soft hover:text-app-strong"
        ].join(" ")}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
