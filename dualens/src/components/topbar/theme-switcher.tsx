"use client";

import { useEffect, useRef, useState } from "react";
import { useAppPreferences } from "@/lib/app-preferences";
import { type ThemeMode, useThemePreferences } from "@/lib/theme";
import { getSiteCopy } from "@/locales/site-copy";

const THEME_OPTIONS: ThemeMode[] = ["light", "dark", "system"];

export function ThemeSwitcher() {
  const { language } = useAppPreferences();
  const { setThemeMode, themeMode } = useThemePreferences();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const copy = getSiteCopy(language);
  const currentLabel = copy.topbar.themeOptions[themeMode];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${copy.topbar.themeLabel}: ${currentLabel}`}
        className="inline-flex h-10 min-w-[7.5rem] items-center justify-between gap-2 rounded-[8px] border border-app-line bg-app-panel/82 px-3 text-xs font-medium text-app-strong shadow-app-soft backdrop-blur transition hover:bg-app-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
        onClick={() => setOpen((current) => !current)}
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-app-muted"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="8" className="stroke-current" strokeWidth="1.6" />
          <path d="M12 4a8 8 0 0 1 0 16Z" className="fill-current" />
        </svg>
        <span>{copy.topbar.themeLabel}</span>
        <span className="text-app-muted">{currentLabel}</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[9rem] rounded-[8px] border border-app-line bg-app-panel p-1 shadow-[0_18px_48px_var(--shadow-strong)]"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={themeMode === option}
              className={[
                "flex w-full items-center justify-between rounded-[7px] px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
                themeMode === option
                  ? "bg-app-strong text-app-inverse"
                  : "text-app-foreground hover:bg-app-soft"
              ].join(" ")}
              onClick={() => {
                setThemeMode(option);
                setOpen(false);
              }}
            >
              <span>{copy.topbar.themeOptions[option]}</span>
              <span
                aria-hidden="true"
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  themeMode === option ? "bg-current" : "bg-transparent"
                ].join(" ")}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
