import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionForm } from "@/components/question-form";

function getCardBySideName(sideName: string) {
  const sideNameNode = screen.getByText(sideName);
  const card = sideNameNode.closest("section");

  if (!card) {
    throw new Error(`Missing card for "${sideName}"`);
  }

  return card;
}

describe("QuestionForm", () => {
  it("keeps the Lumina order chip idle state black with white text", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

    const luminaCard = getCardBySideName("Lumina");
    const luminaOrderChip = within(luminaCard).getByRole("button", { name: "First" });

    expect(luminaOrderChip).toHaveClass("bg-black");
    expect(luminaOrderChip).toHaveClass("text-white");
  });

  it("keeps the center swap button idle state white with black text", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

    const swapTemperamentButton = screen.getByRole("button", {
      name: "Swap temperament assignment"
    });
    const swapTemperamentLabel = screen.getByTestId("temperament-swap-icon");

    expect(swapTemperamentButton).toHaveClass("bg-white");
    expect(swapTemperamentButton).toHaveClass("text-black");
    expect(swapTemperamentLabel).toHaveClass("text-black");
  });
});
