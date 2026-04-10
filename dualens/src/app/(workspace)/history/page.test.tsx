import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HistoryPage from "@/app/(workspace)/history/page";

describe("HistoryPage", () => {
  it("renders the renamed history page title", () => {
    render(<HistoryPage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论历史" })).toBeInTheDocument();
  });
});
