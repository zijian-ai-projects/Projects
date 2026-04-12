import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  APP_LANGUAGE_STORAGE_KEY,
  AppPreferencesProvider,
  readStoredLanguage,
  useAppPreferences,
  writeStoredLanguage
} from "@/lib/app-preferences";
import type { UiLanguage } from "@/lib/types";

function PreferenceProbe() {
  const { language, setLanguage } = useAppPreferences();

  return (
    <div>
      <p data-testid="language-value">{language}</p>
      <button type="button" onClick={() => setLanguage("en")}>
        English
      </button>
      <button type="button" onClick={() => setLanguage("zh-CN")}>
        中文
      </button>
    </div>
  );
}

function renderProvider() {
  render(
    <AppPreferencesProvider>
      <PreferenceProbe />
    </AppPreferencesProvider>
  );
}

describe("app preferences", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to Chinese and persists language updates", () => {
    renderProvider();

    expect(screen.getByTestId("language-value")).toHaveTextContent("zh-CN");

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByTestId("language-value")).toHaveTextContent("en");
    expect(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe("en");
  });

  it("loads a stored valid language", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("language-value")).toHaveTextContent("en");
    });
  });

  it("ignores invalid stored language values", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "fr");

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("language-value")).toHaveTextContent("zh-CN");
    });
  });

  it("falls back when storage access fails", () => {
    const failingReadStorage = {
      getItem() {
        throw new Error("blocked");
      }
    };
    const failingWriteStorage = {
      setItem() {
        throw new Error("blocked");
      }
    };

    expect(readStoredLanguage(failingReadStorage)).toBe("zh-CN");
    expect(() => writeStoredLanguage(failingWriteStorage, "en" satisfies UiLanguage)).not.toThrow();
  });
});
