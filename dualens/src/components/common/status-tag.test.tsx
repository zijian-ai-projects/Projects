import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusTag } from "@/components/common/status-tag";

describe("StatusTag", () => {
  it("exposes the chosen tone and content", () => {
    render(<StatusTag tone="success">已配置</StatusTag>);

    expect(screen.getByText("已配置")).toHaveAttribute("data-tone", "success");
  });
});
