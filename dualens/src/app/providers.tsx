"use client";

import type { ReactNode } from "react";
import { AppPreferencesProvider } from "@/lib/app-preferences";
import { ThemeProvider } from "@/lib/theme";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <AppPreferencesProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AppPreferencesProvider>
  );
}
