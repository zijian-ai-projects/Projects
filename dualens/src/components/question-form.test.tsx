import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadActiveSearchEngineDisplay, loadSelectedSearchEngineLabel } = vi.hoisted(() => ({
  loadActiveSearchEngineDisplay: vi.fn(() => ({
    engineId: "tavily",
    engineName: "Tavily",
    configured: false
  })),
  loadSelectedSearchEngineLabel: vi.fn(() => "Tavily")
}));

vi.mock("@/lib/search-engine-preferences", () => ({
  loadActiveSearchEngineDisplay,
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
    loadActiveSearchEngineDisplay.mockReturnValue({
      engineId: "tavily",
      engineName: "Tavily",
      configured: false
    });
    loadSelectedSearchEngineLabel.mockReturnValue("Tavily");
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("removes the standalone model section and links unconfigured model plus search-engine summaries", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.queryByText("模型与参数区")).not.toBeInTheDocument();
    expect(screen.getByText("当前模型")).toBeInTheDocument();
    expect(screen.getAllByText("未配置")).toHaveLength(2);
    expect(screen.getByText("当前搜索引擎")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /当前模型/ })).toHaveAttribute("href", "/providers");
    expect(screen.getByRole("link", { name: /当前搜索引擎/ })).toHaveAttribute("href", "/search-engines");
    expect(screen.queryByText("本次辩论将使用当前默认模型与搜索引擎。")).not.toBeInTheDocument();
  });

  it("shows the selected configured provider model in the action summary", async () => {
    window.localStorage.setItem("dualens:selectedModelProviderId", "openai");
    window.localStorage.setItem(
      "dualens:modelProviderConfigs",
      JSON.stringify({
        openai: {
          providerId: "openai",
          apiKey: "client-openai-key",
          modelId: "gpt-4.1",
          endpoint: "https://api.openai.com/v1",
          extra: ""
        }
      })
    );

    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(await screen.findByText("gpt-4.1")).toBeInTheDocument();
  });

  it("shows the selected configured search engine in the action summary", async () => {
    loadActiveSearchEngineDisplay.mockReturnValue({
      engineId: "google",
      engineName: "Google",
      configured: true
    });

    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(await screen.findByText("Google")).toBeInTheDocument();
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

  it("keeps role cards wide and anchors runtime controls to the top of the action card", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(screen.getByTestId("role-config-grid")).toHaveClass("max-w-none");
    expect(screen.getByTestId("role-config-grid")).toHaveClass(
      "xl:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)]"
    );

    const actionSection = screen.getByRole("heading", { level: 2, name: "操作区" }).closest("section");
    const actionHeader = actionSection?.firstElementChild;
    const actionRow = screen.getByTestId("debate-action-row");

    expect(actionHeader).toContainElement(actionRow);
    expect(actionRow).toHaveClass("lg:justify-end");
    expect(actionRow).not.toHaveClass("lg:-mt-2");
  });

  it("does not server-render a hard-coded search-engine fallback", () => {
    loadActiveSearchEngineDisplay.mockReturnValue({
      engineId: "google",
      engineName: "Google",
      configured: true
    });

    const html = renderToString(<QuestionForm onSubmit={vi.fn()} uiLanguage="zh-CN" />);

    expect(html).not.toContain("Tavily");
    expect(html).toContain("未配置");
  });
});
