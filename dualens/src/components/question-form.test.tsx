import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadSelectedSearchEngineLabel } = vi.hoisted(() => ({
  loadSelectedSearchEngineLabel: vi.fn(() => "Tavily")
}));

vi.mock("@/lib/search-engine-preferences", () => ({
  loadSelectedSearchEngineLabel
}));

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
  beforeEach(() => {
    loadSelectedSearchEngineLabel.mockReturnValue("Tavily");
  });

  it("removes the standalone model section and shows model plus search-engine summary", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.queryByText("模型与参数区")).not.toBeInTheDocument();
    expect(screen.getByText("当前模型")).toBeInTheDocument();
    expect(screen.getByText("deepseek-chat")).toBeInTheDocument();
    expect(screen.getByText("当前搜索引擎")).toBeInTheDocument();
    expect(screen.getByText("Tavily")).toBeInTheDocument();
  });

  it("renders compact style summaries instead of the speaking-order block", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.getByText("风格：谨慎")).toBeInTheDocument();
    expect(screen.getByText("风格：激进")).toBeInTheDocument();
    expect(screen.queryByText("发言顺序")).not.toBeInTheDocument();

    const luminaCard = getCardBySideName("乾明");
    const luminaOrderChip = within(luminaCard).getByRole("button", { name: "先" });

    expect(luminaOrderChip).toHaveClass("rounded-full");
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

  it("does not server-render a hard-coded search-engine fallback", () => {
    loadSelectedSearchEngineLabel.mockReturnValue("Google");

    const html = renderToString(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(html).not.toContain("Tavily");
    expect(html).toContain("同步中");
  });
});
