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
  return render(
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
    expect(within(engineList).queryByText("已配置")).not.toBeInTheDocument();
    expect(within(engineList).getAllByText("未配置").length).toBeGreaterThan(0);
    expect(within(engineList).queryByText("已接入")).not.toBeInTheDocument();
    expect(engineList.querySelector("[data-tone]")).not.toBeInTheDocument();

    const tavilyCard = screen.getByRole("radio", { name: "Tavily" });
    const googleCard = screen.getByRole("radio", { name: "Google" });

    expect(tavilyCard).toHaveAttribute("aria-checked", "true");
    expect(googleCard).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("link", { name: "获取 API" })).toHaveAttribute(
      "href",
      "https://app.tavily.com/"
    );
    expect(screen.getByRole("link", { name: "查看教程" })).toHaveAttribute(
      "href",
      "https://docs.tavily.com/guides/quickstart"
    );

    await user.click(googleCard);

    expect(googleCard).toHaveAttribute("aria-checked", "true");
    expect(tavilyCard).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("heading", { level: 2, name: "Google" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "获取 API" })).toHaveAttribute(
      "href",
      "https://console.cloud.google.com/apis/credentials"
    );
    expect(screen.getByRole("link", { name: "查看教程" })).toHaveAttribute(
      "href",
      "https://developers.google.cn/custom-search/v1/introduction?hl=en"
    );
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

  it("auto-saves search engine configuration and restores it after remount", async () => {
    const user = userEvent.setup();
    const view = renderSearchEnginesPage();

    await user.type(screen.getByLabelText("API Key"), "client-tavily-key");

    expect(screen.queryByRole("button", { name: "重置" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "保存配置" })).not.toBeInTheDocument();

    const storedConfigs = JSON.parse(
      window.localStorage.getItem("dualens:searchEngineConfigs") ?? "{}"
    ) as Record<string, { apiKey?: string; endpoint?: string }>;
    expect(storedConfigs.tavily).toMatchObject({
      apiKey: "client-tavily-key",
      endpoint: "https://api.tavily.com/search"
    });

    const configuredStatus = within(screen.getByRole("radio", { name: "Tavily" })).getByText("已配置");
    expect(configuredStatus).toHaveClass("inline-flex");
    expect(configuredStatus).toHaveClass("rounded-full");
    expect(configuredStatus).toHaveClass("bg-black");
    expect(configuredStatus).toHaveClass("text-white");

    view.unmount();
    renderSearchEnginesPage();

    expect(await screen.findByRole("radio", { name: "Tavily" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByLabelText("API Key")).toHaveValue("client-tavily-key");
    expect(screen.getByLabelText("API Endpoint")).toHaveValue("https://api.tavily.com/search");
    expect(within(screen.getByRole("radio", { name: "Tavily" })).getByText("已配置")).toHaveClass("bg-black");
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
