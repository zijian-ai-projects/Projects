import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchEnginesPage from "@/app/(workspace)/search-engines/page";

describe("SearchEnginesPage", () => {
  it("renders the search engine page title", () => {
    render(<SearchEnginesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "搜索引擎" })).toBeInTheDocument();
  });
});
