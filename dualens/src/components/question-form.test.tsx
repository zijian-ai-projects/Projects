import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
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
    expect(luminaOrderChip).toHaveClass("rounded-[8px]");
    expect(luminaOrderChip).toHaveClass("border-app-strong");
    expect(vigilaOrderChip).toHaveClass("text-app-inverse");
  });

  it("toggles the center swap button color without hover-driven inversion", () => {
    render(<QuestionForm onSubmit={vi.fn()} uiLanguage="en" />);

    const swapTemperamentButton = screen.getByRole("button", {
      name: "Swap temperament assignment"
    });
    const swapTemperamentLabel = screen.getByTestId("temperament-swap-icon");

    expect(swapTemperamentButton).toHaveClass("rounded-[8px]");
    expect(swapTemperamentButton).toHaveClass("bg-app-card");
    expect(swapTemperamentButton).toHaveClass("text-app-strong");
    expect(swapTemperamentButton).not.toHaveClass("hover:bg-app-strong");
    expect(swapTemperamentButton).not.toHaveClass("hover:text-app-inverse");
    expect(swapTemperamentLabel).toHaveClass("text-app-strong");

    fireEvent.click(swapTemperamentButton);

    expect(swapTemperamentButton).toHaveClass("bg-app-strong");
    expect(swapTemperamentButton).toHaveClass("text-app-inverse");
    expect(swapTemperamentLabel).toHaveClass("text-app-inverse");

    fireEvent.click(swapTemperamentButton);

    expect(swapTemperamentButton).toHaveClass("bg-app-card");
    expect(swapTemperamentButton).toHaveClass("text-app-strong");
    expect(swapTemperamentLabel).toHaveClass("text-app-strong");
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

  it("shows the current debate mode and submits the selected mode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);

    render(<QuestionForm onSubmit={onSubmit} uiLanguage="zh-CN" />);

    const actionRow = screen.getByTestId("debate-action-row");
    const modelSummary = within(actionRow).getByRole("link", { name: /当前模型/ });
    const searchEngineSummary = within(actionRow).getByRole("link", { name: /当前搜索引擎/ });
    const modeSwitch = within(actionRow).getByRole("button", {
      name: /辩论模式.*共证衡辩/
    });

    expect(modelSummary).toHaveClass("min-w-[128px]");
    expect(modelSummary).toHaveClass("rounded-[16px]");
    expect(modelSummary).toHaveClass("text-left");
    expect(searchEngineSummary).toHaveClass("min-w-[128px]");
    expect(searchEngineSummary).toHaveClass("rounded-[16px]");
    expect(searchEngineSummary).toHaveClass("text-left");
    expect(modeSwitch).toHaveClass("min-w-[128px]");
    expect(modeSwitch).toHaveClass("rounded-[16px]");
    expect(modeSwitch).toHaveClass("text-left");
    expect(modeSwitch).not.toHaveClass("absolute");

    await user.click(modeSwitch);
    expect(within(actionRow).getByRole("button", { name: /隔证三辩/ })).toBeInTheDocument();

    await user.type(screen.getByLabelText("决策问题"), "我应该为了工作搬到另一个城市吗？");
    await user.click(screen.getByRole("button", { name: "开始辩论" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        debateMode: "private-evidence"
      })
    );
  });

  it("uses a five-character minimum for Chinese decision questions", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);

    render(<QuestionForm onSubmit={onSubmit} uiLanguage="zh-CN" />);

    await user.type(screen.getByLabelText("决策问题"), "换工作吗");
    await user.click(screen.getByRole("button", { name: "开始辩论" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("问题至少需要 5 个字符。");
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("决策问题"));
    await user.type(screen.getByLabelText("决策问题"), "要换工作吗");
    await user.click(screen.getByRole("button", { name: "开始辩论" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "要换工作吗",
        language: "zh-CN"
      })
    );
  });

  it("keeps a ten-character minimum for English decision questions", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);

    render(<QuestionForm onSubmit={onSubmit} uiLanguage="en" />);

    await user.type(screen.getByLabelText("Decision question"), "Move now?");
    await user.click(screen.getByRole("button", { name: "Start debate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Question must be at least 10 characters.");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
