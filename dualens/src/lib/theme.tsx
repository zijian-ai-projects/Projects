"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "dualens:theme-mode";
const DEFAULT_THEME_MODE: ThemeMode = "system";

type ThemePreferencesValue = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode(themeMode: ThemeMode): void;
};

const ThemePreferencesContext = createContext<ThemePreferencesValue | null>(null);

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredThemeMode(storage: Pick<Storage, "getItem">): ThemeMode {
  try {
    const storedTheme = storage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
}

export function writeStoredThemeMode(
  storage: Pick<Storage, "setItem">,
  themeMode: ThemeMode
) {
  try {
    storage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch {
    return;
  }
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(themeMode: ThemeMode): ResolvedTheme {
  return themeMode === "system" ? getSystemTheme() : themeMode;
}

function applyThemeAttributes(themeMode: ThemeMode, resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themeMode = themeMode;
  document.documentElement.style.colorScheme = resolvedTheme;
}

function readInitialThemeMode() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  return readStoredThemeMode(window.localStorage);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readInitialThemeMode);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readInitialThemeMode()));

  useEffect(() => {
    const nextResolvedTheme = resolveTheme(themeMode);
    setResolvedTheme(nextResolvedTheme);
    applyThemeAttributes(themeMode, nextResolvedTheme);

    if (
      themeMode !== "system" ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(systemTheme);
      applyThemeAttributes("system", systemTheme);
    };

    mediaQuery.addEventListener?.("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener?.("change", handleSystemThemeChange);
    };
  }, [themeMode]);

  const value = useMemo<ThemePreferencesValue>(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode(nextThemeMode) {
        setThemeModeState(nextThemeMode);
        if (typeof window !== "undefined") {
          writeStoredThemeMode(window.localStorage, nextThemeMode);
        }
      }
    }),
    [resolvedTheme, themeMode]
  );

  return (
    <ThemePreferencesContext.Provider value={value}>
      {children}
    </ThemePreferencesContext.Provider>
  );
}

export function useThemePreferences() {
  const value = useContext(ThemePreferencesContext);

  if (!value) {
    throw new Error("useThemePreferences must be used within ThemeProvider");
  }

  return value;
}
