import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";
import { APP_LANGUAGE_STORAGE_KEY, AppPreferencesProvider } from "@/lib/app-preferences";

function renderSearchEnginesPage() {
  render(
    <AppPreferencesProvider>
      <SearchEnginesPage />
    </AppPreferencesProvider>
  );
}

function renderSearchEnginesPageMarkup() {
  return (
    <AppPreferencesProvider>
      <SearchEnginesPage />
    </AppPreferencesProvider>
  );
}

describe("SearchEnginesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders search engines with the same radio-like selection pattern", async () => {
    const user = userEvent.setup();
    renderSearchEnginesPage();

    expect(screen.getByRole("heading", { level: 1, name: "搜索引擎" })).toBeInTheDocument();
    const engineList = screen.getByRole("radiogroup", { name: "搜索引擎" });

    expect(engineList).toBeInTheDocument();
    expect(within(engineList).getByText("已配置")).toHaveClass("text-black");
    expect(within(engineList).getAllByText("未配置").length).toBeGreaterThan(0);
    expect(within(engineList).queryByText("已接入")).not.toBeInTheDocument();
    expect(engineList.querySelector("[data-tone]")).not.toBeInTheDocument();

    const tavilyCard = screen.getByRole("radio", { name: "Tavily" });
    const googleCard = screen.getByRole("radio", { name: "Google" });

    expect(tavilyCard).toHaveAttribute("aria-checked", "true");
    expect(googleCard).toHaveAttribute("aria-checked", "false");

    await user.click(googleCard);

    expect(googleCard).toHaveAttribute("aria-checked", "true");
    expect(tavilyCard).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("heading", { level: 2, name: "Google" })).toBeInTheDocument();
    expect(screen.getByLabelText("API Key")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("API Endpoint")).toHaveValue("https://customsearch.googleapis.com");
    expect(screen.getByLabelText("Engine ID / CX / App ID")).toBeInTheDocument();
  });

  it("restores and persists the selected search engine locally", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("dualens:selectedSearchEngineId", "google");

    renderSearchEnginesPage();

    const googleCard = screen.getByRole("radio", { name: "Google" });
    const bingCard = screen.getByRole("radio", { name: "Bing" });

    expect(googleCard).toHaveAttribute("aria-checked", "true");

    await user.click(bingCard);

    expect(window.localStorage.getItem("dualens:selectedSearchEngineId")).toBe("bing");
  });

  it("hydrates without mismatch when a saved engine exists", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    const container = document.createElement("div");

    window.localStorage.setItem("dualens:selectedSearchEngineId", "google");

    try {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: undefined
      });

      const serverMarkup = renderToString(renderSearchEnginesPageMarkup());

      if (windowDescriptor) {
        Object.defineProperty(globalThis, "window", windowDescriptor);
      }

      document.body.appendChild(container);
      container.innerHTML = serverMarkup;

      let root: ReturnType<typeof hydrateRoot> | undefined;

      await act(async () => {
        root = hydrateRoot(container, renderSearchEnginesPageMarkup());
      });

      await waitFor(() => {
        expect(screen.getByRole("radio", { name: "Google" })).toHaveAttribute(
          "aria-checked",
          "true"
        );
      });

      expect(errorSpy).not.toHaveBeenCalled();
      root?.unmount();
    } finally {
      container.remove();
      errorSpy.mockRestore();

      if (windowDescriptor) {
        Object.defineProperty(globalThis, "window", windowDescriptor);
      }
    }
  });

  it("uses the stored English global language for page chrome", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    renderSearchEnginesPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Search engines" })).toBeInTheDocument();
    });
    expect(screen.getByText("Search engine list")).toBeInTheDocument();
  });
});
