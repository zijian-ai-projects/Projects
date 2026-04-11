"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { UiLanguage } from "@/lib/types";

export const APP_LANGUAGE_STORAGE_KEY = "dualens:app-language";
const DEFAULT_LANGUAGE: UiLanguage = "zh-CN";

export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === "zh-CN" || value === "en";
}

export function readStoredLanguage(storage: Pick<Storage, "getItem">): UiLanguage {
  try {
    const storedLanguage = storage.getItem(APP_LANGUAGE_STORAGE_KEY);

    return isUiLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function writeStoredLanguage(
  storage: Pick<Storage, "setItem">,
  language: UiLanguage
) {
  try {
    storage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  } catch {
    return;
  }
}

type AppPreferencesValue = {
  language: UiLanguage;
  setLanguage(language: UiLanguage): void;
};

const AppPreferencesContext = createContext<AppPreferencesValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(readStoredLanguage(window.localStorage));
  }, []);

  const value = useMemo<AppPreferencesValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        writeStoredLanguage(window.localStorage, nextLanguage);
      }
    }),
    [language]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const value = useContext(AppPreferencesContext);

  if (!value) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }

  return value;
}
