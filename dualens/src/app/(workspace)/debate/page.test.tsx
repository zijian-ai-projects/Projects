import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DebatePage from "@/app/(workspace)/debate/page";
import { APP_LANGUAGE_STORAGE_KEY, AppPreferencesProvider } from "@/lib/app-preferences";

function renderDebatePage() {
  render(
    <AppPreferencesProvider>
      <DebatePage />
    </AppPreferencesProvider>
  );
}

describe("DebatePage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the new formal debate-page sections", () => {
    renderDebatePage();

    expect(screen.getByRole("heading", { level: 1, name: "辩论" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "问题输入区" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "双角色配置区" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "模型与参数区" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "操作区" })).toBeInTheDocument();
    expect(screen.getByText("当前模型")).toBeInTheDocument();
    expect(screen.getByText("当前搜索引擎")).toBeInTheDocument();
    expect(screen.queryByText("围绕同一问题配置两位 AI 的立场、风格与模型，再启动正式的双智能体辩论流程。")).not.toBeInTheDocument();
    expect(screen.getByText("围绕同一问题确认双方立场与风格后，直接启动正式的双智能体辩论流程。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始辩论" })).toBeInTheDocument();
    expect(screen.queryByLabelText("界面语言")).not.toBeInTheDocument();
  });

  it("uses the stored global language instead of a local debate-page toggle", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    renderDebatePage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Debate" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Start debate" })).toBeInTheDocument();
    expect(screen.queryByLabelText("UI language")).not.toBeInTheDocument();
  });
});
