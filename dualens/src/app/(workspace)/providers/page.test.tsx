import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProvidersPage from "@/app/(workspace)/providers/page";

describe("ProvidersPage", () => {
  it("renders the provider list and configuration form", () => {
    render(<ProvidersPage />);

    expect(screen.getByRole("heading", { level: 1, name: "AI 服务商" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /DeepSeek/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("已配置").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
    expect(screen.getByLabelText("模型 ID")).toBeInTheDocument();
    expect(screen.getByLabelText("API Endpoint")).toBeInTheDocument();
  });
});
