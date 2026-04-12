import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  ThemeProvider,
  readStoredThemeMode,
  useThemePreferences
} from "@/lib/theme";

function installMatchMedia(matches: boolean) {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: addEventListener,
      removeListener: removeEventListener,
      dispatchEvent: vi.fn()
    }))
  });

  return { addEventListener, removeEventListener };
}

function ThemeProbe() {
  const { resolvedTheme, setThemeMode, themeMode } = useThemePreferences();

  return (
    <div>
      <p data-testid="theme-mode">{themeMode}</p>
      <p data-testid="resolved-theme">{resolvedTheme}</p>
      <button type="button" onClick={() => setThemeMode("dark")}>
        Dark
      </button>
      <button type="button" onClick={() => setThemeMode("system")}>
        System
      </button>
    </div>
  );
}

describe("theme preferences", () => {
  beforeEach(() => {
    installMatchMedia(false);
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
    vi.restoreAllMocks();
  });

  it("defaults to system, resolves the current system theme, and applies document attributes", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).toHaveAttribute("data-theme-mode", "system");
  });

  it("persists explicit theme changes", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("ignores invalid stored theme values", () => {
    const failingStorage = {
      getItem() {
        return "neon";
      }
    };

    expect(readStoredThemeMode(failingStorage)).toBe("system");
  });
});
