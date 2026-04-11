import "@testing-library/jest-dom/vitest";

import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProvidersPage from "@/app/(workspace)/providers/page";
import { APP_LANGUAGE_STORAGE_KEY, AppPreferencesProvider } from "@/lib/app-preferences";

function renderProvidersPage() {
  return render(
    <AppPreferencesProvider>
      <ProvidersPage />
    </AppPreferencesProvider>
  );
}

describe("ProvidersPage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("lets the provider card selection drive the right panel", async () => {
    const user = userEvent.setup();
    renderProvidersPage();

    expect(screen.getByRole("heading", { level: 1, name: "AI 服务商" })).toBeInTheDocument();
    const providerList = screen.getByRole("radiogroup", { name: "AI 服务商" });

    expect(providerList).toBeInTheDocument();
    expect(within(providerList).queryByText("已配置")).not.toBeInTheDocument();
    expect(within(providerList).getAllByText("未配置").length).toBeGreaterThan(0);
    expect(within(providerList).queryByText("已接入")).not.toBeInTheDocument();
    expect(providerList.querySelector("[data-tone]")).not.toBeInTheDocument();

    const deepSeekCard = screen.getByRole("radio", { name: "DeepSeek" });
    const openAiCard = screen.getByRole("radio", { name: "OpenAI" });

    expect(deepSeekCard).toHaveAttribute("aria-checked", "true");
    expect(openAiCard).toHaveAttribute("aria-checked", "false");
    expect(deepSeekCard).toHaveAttribute("tabindex", "0");
    expect(openAiCard).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("link", { name: "获取 API" })).toHaveAttribute(
      "href",
      "https://platform.deepseek.com/api_keys"
    );
    expect(screen.getByRole("link", { name: "查看教程" })).toHaveAttribute(
      "href",
      "https://api-docs.deepseek.com/"
    );

    deepSeekCard.focus();
    await user.keyboard("{ArrowDown}");

    expect(openAiCard).toHaveFocus();
    expect(openAiCard).toHaveAttribute("aria-checked", "true");
    expect(deepSeekCard).toHaveAttribute("aria-checked", "false");
    expect(openAiCard).toHaveAttribute("tabindex", "0");
    expect(deepSeekCard).toHaveAttribute("tabindex", "-1");

    expect(screen.getByRole("heading", { level: 2, name: "OpenAI" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "获取 API" })).toHaveAttribute(
      "href",
      "https://platform.openai.com/api-keys"
    );
    expect(screen.getByRole("link", { name: "查看教程" })).toHaveAttribute(
      "href",
      "https://platform.openai.com/docs/quickstart"
    );
    expect(screen.getByLabelText("API Endpoint")).toHaveValue("https://api.openai.com/v1");
    expect(screen.getByLabelText("模型 ID")).toHaveValue("");
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  });

  it("prevents default Home and End key behavior inside the provider radiogroup", () => {
    renderProvidersPage();

    const deepSeekCard = screen.getByRole("radio", { name: "DeepSeek" });
    const doubaoCard = screen.getByRole("radio", { name: "豆包" });

    expect(fireEvent.keyDown(deepSeekCard, { key: "Home" })).toBe(false);
    expect(fireEvent.keyDown(doubaoCard, { key: "End" })).toBe(false);
  });

  it("auto-saves provider configuration and restores it after remount", async () => {
    const user = userEvent.setup();
    const view = renderProvidersPage();

    await user.click(screen.getByRole("radio", { name: "OpenAI" }));
    await user.type(screen.getByLabelText("API Key"), "client-openai-key");
    await user.type(screen.getByLabelText("模型 ID"), "gpt-4.1");
    await user.clear(screen.getByLabelText("API Endpoint"));
    await user.type(screen.getByLabelText("API Endpoint"), "https://api.openai.com/v1");

    expect(screen.queryByRole("button", { name: "重置" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "保存配置" })).not.toBeInTheDocument();

    const storedConfigs = JSON.parse(
      window.localStorage.getItem("dualens:modelProviderConfigs") ?? "{}"
    ) as Record<string, { apiKey?: string; modelId?: string; endpoint?: string }>;
    expect(storedConfigs.openai).toMatchObject({
      apiKey: "client-openai-key",
      modelId: "gpt-4.1",
      endpoint: "https://api.openai.com/v1"
    });

    const configuredStatus = within(screen.getByRole("radio", { name: "OpenAI" })).getByText("已配置");
    expect(configuredStatus).toHaveClass("inline-flex");
    expect(configuredStatus).toHaveClass("rounded-full");
    expect(configuredStatus).toHaveClass("bg-black");
    expect(configuredStatus).toHaveClass("text-white");

    view.unmount();
    renderProvidersPage();

    await user.click(screen.getByRole("radio", { name: "OpenAI" }));

    expect(screen.getByLabelText("API Key")).toHaveValue("client-openai-key");
    expect(screen.getByLabelText("模型 ID")).toHaveValue("gpt-4.1");
    expect(screen.getByLabelText("API Endpoint")).toHaveValue("https://api.openai.com/v1");
    expect(within(screen.getByRole("radio", { name: "OpenAI" })).getByText("已配置")).toHaveClass("bg-black");
  });

  it("uses the stored English global language for page chrome", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    renderProvidersPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "AI providers" })).toBeInTheDocument();
    });
    expect(screen.getByText("Provider list")).toBeInTheDocument();
  });
});
