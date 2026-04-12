"use client";

import { useEffect } from "react";
import { useAppPreferences } from "@/lib/app-preferences";
import type { UiLanguage } from "@/lib/types";

export function WorkspaceLanguageSync({ language }: { language: UiLanguage }) {
  const { setLanguage } = useAppPreferences();

  useEffect(() => {
    setLanguage(language);
  }, [language, setLanguage]);

  return null;
}
