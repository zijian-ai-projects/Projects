import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(screen.queryByText("本次辩论将使用当前默认模型与搜索引擎。")).not.toBeInTheDocument();
  });

  it("renders compact style labels instead of prefixed style summaries", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.queryByText("风格：谨慎")).not.toBeInTheDocument();
    expect(screen.queryByText("风格：激进")).not.toBeInTheDocument();
    expect(screen.queryByText("发言顺序")).not.toBeInTheDocument();

    const luminaCard = getCardBySideName("乾明");
    const vigilaCard = getCardBySideName("坤察");
    const luminaOrderChip = within(luminaCard).getByRole("button", { name: "先" });
    const vigilaOrderChip = within(vigilaCard).getByRole("button", { name: "后" });

    expect(within(luminaCard).getByText("谨慎")).toBeInTheDocument();
    expect(within(vigilaCard).getByText("激进")).toBeInTheDocument();
    expect(luminaOrderChip).toHaveClass("rounded-full");
    expect(luminaOrderChip).toHaveClass("border-black");
    expect(vigilaOrderChip).toHaveClass("text-white");
  });

  it("toggles the center swap button color without hover-driven inversion", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

    const swapTemperamentButton = screen.getByRole("button", {
      name: "Swap temperament assignment"
    });
    const swapTemperamentLabel = screen.getByTestId("temperament-swap-icon");

    expect(swapTemperamentButton).toHaveClass("bg-white");
    expect(swapTemperamentButton).toHaveClass("text-black");
    expect(swapTemperamentButton).not.toHaveClass("hover:bg-black");
    expect(swapTemperamentButton).not.toHaveClass("hover:text-white");
    expect(swapTemperamentLabel).toHaveClass("text-black");

    fireEvent.click(swapTemperamentButton);

    expect(swapTemperamentButton).toHaveClass("bg-black");
    expect(swapTemperamentButton).toHaveClass("text-white");
    expect(swapTemperamentLabel).toHaveClass("text-white");

    fireEvent.click(swapTemperamentButton);

    expect(swapTemperamentButton).toHaveClass("bg-white");
    expect(swapTemperamentButton).toHaveClass("text-black");
    expect(swapTemperamentLabel).toHaveClass("text-black");
  });

  it("keeps role cards wide and shifts runtime controls next to the start button", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.getByTestId("role-config-grid")).toHaveClass("max-w-none");
    expect(screen.getByTestId("role-config-grid")).toHaveClass(
      "xl:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)]"
    );
    expect(screen.getByTestId("debate-action-row")).toHaveClass("lg:justify-end");
    expect(screen.getByTestId("debate-action-row")).toHaveClass("lg:-mt-2");
  });

  it("does not server-render a hard-coded search-engine fallback", () => {
    loadSelectedSearchEngineLabel.mockReturnValue("Google");

    const html = renderToString(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(html).not.toContain("Tavily");
    expect(html).toContain("同步中");
  });
});
