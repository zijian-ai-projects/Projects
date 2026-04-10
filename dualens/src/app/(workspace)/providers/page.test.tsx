import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProvidersPage from "@/app/(workspace)/providers/page";

describe("ProvidersPage", () => {
  it("lets the provider card selection drive the right panel", async () => {
    const user = userEvent.setup();
    render(<ProvidersPage />);

    expect(screen.getByRole("heading", { level: 1, name: "AI 服务商" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "AI 服务商" })).toBeInTheDocument();

    const deepSeekCard = screen.getByRole("radio", { name: "DeepSeek" });
    const openAiCard = screen.getByRole("radio", { name: "OpenAI" });

    expect(deepSeekCard).toHaveAttribute("aria-checked", "true");
    expect(openAiCard).toHaveAttribute("aria-checked", "false");

    await user.click(openAiCard);

    expect(openAiCard).toHaveAttribute("aria-checked", "true");
    expect(deepSeekCard).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("heading", { level: 2, name: "OpenAI" })).toBeInTheDocument();
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
    expect(screen.getByLabelText("模型 ID")).toBeInTheDocument();
    expect(screen.getByLabelText("API Endpoint")).toBeInTheDocument();
    expect(screen.getAllByTestId("selection-indicator")).toHaveLength(4);
  });
});
