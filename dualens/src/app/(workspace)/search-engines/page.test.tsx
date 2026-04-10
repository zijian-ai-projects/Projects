import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";

describe("SearchEnginesPage", () => {
  it("renders search engines with the same radio-like selection pattern", async () => {
    const user = userEvent.setup();
    render(<SearchEnginesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "搜索引擎" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "搜索引擎" })).toBeInTheDocument();

    const tavilyCard = screen.getByRole("radio", { name: "Tavily" });
    const googleCard = screen.getByRole("radio", { name: "Google" });

    expect(tavilyCard).toHaveAttribute("aria-checked", "true");
    expect(googleCard).toHaveAttribute("aria-checked", "false");

    await user.click(googleCard);

    expect(googleCard).toHaveAttribute("aria-checked", "true");
    expect(tavilyCard).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("heading", { level: 2, name: "Google" })).toBeInTheDocument();
    expect(screen.getByLabelText("API Endpoint")).toHaveValue("https://customsearch.googleapis.com");
    expect(screen.getByLabelText("Engine ID / CX / App ID")).toBeInTheDocument();
    expect(screen.getAllByTestId("selection-indicator")).toHaveLength(4);
  });
});
