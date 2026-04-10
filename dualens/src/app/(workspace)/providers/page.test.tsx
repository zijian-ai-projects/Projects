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
    expect(deepSeekCard).toHaveAttribute("tabindex", "0");
    expect(openAiCard).toHaveAttribute("tabindex", "-1");

    deepSeekCard.focus();
    await user.keyboard("{ArrowDown}");

    expect(openAiCard).toHaveFocus();
    expect(openAiCard).toHaveAttribute("aria-checked", "true");
    expect(deepSeekCard).toHaveAttribute("aria-checked", "false");
    expect(openAiCard).toHaveAttribute("tabindex", "0");
    expect(deepSeekCard).toHaveAttribute("tabindex", "-1");

    expect(screen.getByRole("heading", { level: 2, name: "OpenAI" })).toBeInTheDocument();
    expect(screen.getByLabelText("API Endpoint")).toHaveValue("https://api.openai.com/v1");
    expect(screen.getByLabelText("模型 ID")).toHaveValue("");
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  });
});
