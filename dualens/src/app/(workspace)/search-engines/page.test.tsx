import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";

describe("SearchEnginesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders search engines with the same radio-like selection pattern", async () => {
    const user = userEvent.setup();
    render(<SearchEnginesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "搜索引擎" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "搜索引擎" })).toBeInTheDocument();

    const tavilyCard = screen.getByRole("radio", { name: /Tavily.*已配置/ });
    const googleCard = screen.getByRole("radio", { name: /Google.*未配置/ });

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

    render(<SearchEnginesPage />);

    const googleCard = screen.getByRole("radio", { name: /Google.*未配置/ });
    const bingCard = screen.getByRole("radio", { name: /Bing.*未配置/ });

    expect(googleCard).toHaveAttribute("aria-checked", "true");

    await user.click(bingCard);

    expect(window.localStorage.getItem("dualens:selectedSearchEngineId")).toBe("bing");
  });
});
