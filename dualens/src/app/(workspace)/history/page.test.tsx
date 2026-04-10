import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HistoryPage from "@/app/(workspace)/history/page";

describe("HistoryPage", () => {
  it("renders searchable history cards and the renamed history page title", () => {
    render(<HistoryPage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论历史" })).toBeInTheDocument();
    expect(screen.getByLabelText("搜索历史")).toBeInTheDocument();
    expect(screen.getByText("是否应该在今年转去独立开发？")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "查看详情" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "重新发起同题辩论" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "删除" }).length).toBeGreaterThan(0);
  });
});
