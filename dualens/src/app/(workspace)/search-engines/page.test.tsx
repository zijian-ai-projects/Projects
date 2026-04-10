import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";

describe("SearchEnginesPage", () => {
  it("renders the search engine page shell", () => {
    render(<SearchEnginesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "搜索引擎" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "搜索引擎列表" })).toBeInTheDocument();
    expect(screen.getByText("Bing / 百度 / Google / Tavily")).toBeInTheDocument();
  });
});
