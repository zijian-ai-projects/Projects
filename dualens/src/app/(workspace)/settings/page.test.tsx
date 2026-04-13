import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/history-folder-store", () => ({
  loadHistoryFolderState: vi.fn(async () => ({
    status: "authorized",
    folderName: "Dualens Histories"
  })),
  chooseHistoryFolder: vi.fn(),
  clearHistoryFolder: vi.fn(async () => ({
    status: "unselected",
    folderName: null
  }))
}));

import SettingsPage from "@/app/(workspace)/settings/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";
import {
  clearHistoryFolder,
  loadHistoryFolderState
} from "@/lib/history-folder-store";

const loadHistoryFolderStateMock = vi.mocked(loadHistoryFolderState);
const clearHistoryFolderMock = vi.mocked(clearHistoryFolder);

function renderSettingsPage() {
  render(
    <AppPreferencesProvider>
      <SettingsPage />
    </AppPreferencesProvider>
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearHistoryFolderMock.mockClear();
    loadHistoryFolderStateMock.mockResolvedValue({
      status: "authorized",
      folderName: "Dualens Histories"
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders language controls and the history-folder settings card", async () => {
    renderSettingsPage();

    expect(screen.getByRole("heading", { level: 1, name: "通用设置" })).toBeInTheDocument();
    expect(screen.getByText("语言设置")).toBeInTheDocument();
    expect(screen.getAllByText("控制工作区界面、新建 agent 发言语言和证据展示语言；已保存历史保持创建时语言不变。")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "中文" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByTestId("settings-page-shell")).toHaveClass("max-w-[1600px]");
    expect(screen.getByTestId("settings-card-language")).toHaveClass("overflow-hidden");
    expect(screen.getByTestId("settings-card-history-folder")).toHaveClass("shadow-sm");
    expect(screen.getByTestId("settings-card-icon-language")).toHaveClass("bg-[#D97757]/10");
    expect(screen.getByTestId("settings-card-icon-history-folder")).toHaveClass("bg-[#D97757]/10");
    expect(screen.getByText("辩论历史保存文件夹")).toBeInTheDocument();
    expect(screen.queryByText("默认模型")).not.toBeInTheDocument();
    expect(screen.getByText("每一次辩论记录都会单独保存为一个 JSON 文件，并统一写入你选择的本地目录。")).toBeInTheDocument();
    expect(screen.queryByText("选择一个本地文件夹作为历史目录。后续每场辩论都会生成一个唯一 JSON 文件，文件名带时间戳与会话标识，便于统一归档与后续读取。")).not.toBeInTheDocument();
    expect(screen.queryByText("保存规则：一条辩论记录对应一个 JSON 文件。")).not.toBeInTheDocument();
    expect(screen.queryByText("文件命名：时间戳 + 会话标识，避免同名覆盖。")).not.toBeInTheDocument();
    expect(screen.queryByText("目录句柄仅保存在当前浏览器本地，用于后续自动写入。")).not.toBeInTheDocument();
    expect(await screen.findByText("Dualens Histories")).toBeInTheDocument();
    expect(screen.getByTestId("current-history-folder-row")).toHaveClass("gap-1");
    expect(screen.getByTestId("current-history-folder-row")).toHaveClass("py-2");
    expect(screen.getByTestId("current-history-folder-row")).not.toHaveClass("space-y-2");
    expect(screen.queryByText("已授权")).not.toBeInTheDocument();
    expect(screen.queryByText("如果目录权限失效，可以重新选择同一目录或切换到新的保存位置。")).not.toBeInTheDocument();
    expect(screen.getByTestId("history-folder-status-field")).toHaveClass("h-12");
    expect(screen.getByTestId("history-folder-status-field")).toHaveClass("font-mono");
    expect(screen.getByRole("button", { name: "重新选择" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除保存目录" })).toBeInTheDocument();
  });

  it("updates page chrome when the settings language changes", async () => {
    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByRole("heading", { level: 1, name: "General settings" })).toBeInTheDocument();
    expect(screen.getByText("Debate history folder")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("shows the choose action for an unselected folder state", async () => {
    loadHistoryFolderStateMock.mockResolvedValueOnce({
      status: "unselected",
      folderName: null
    });

    renderSettingsPage();

    expect(await screen.findByRole("button", { name: "选择文件夹" })).toBeInTheDocument();
    expect(screen.getAllByText("未选择").length).toBeGreaterThan(0);
    expect(screen.getByTestId("history-folder-status-field")).toHaveClass("border-dashed");
  });

  it("disables folder picking when the browser does not support directory access", async () => {
    loadHistoryFolderStateMock.mockResolvedValueOnce({
      status: "unsupported",
      folderName: null
    });

    renderSettingsPage();

    expect(await screen.findByText("当前浏览器不支持")).toBeInTheDocument();
    expect(screen.getByText("当前浏览器不支持目录访问 API，公网 HTTP 地址无法选择本地文件夹。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择文件夹" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "重新选择" })).not.toBeInTheDocument();
  });

  it("clears the saved history folder from the settings card", async () => {
    renderSettingsPage();

    expect(await screen.findByText("Dualens Histories")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清除保存目录" }));

    expect(clearHistoryFolderMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("未选择")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "清除保存目录" })).not.toBeInTheDocument();
  });
});
