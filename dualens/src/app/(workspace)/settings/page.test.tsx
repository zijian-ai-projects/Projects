import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/history-folder-store", () => ({
  loadHistoryFolderState: vi.fn(async () => ({
    status: "authorized",
    folderName: "Dualens Histories"
  })),
  chooseHistoryFolder: vi.fn()
}));

import SettingsPage from "@/app/(workspace)/settings/page";
import { AppPreferencesProvider } from "@/lib/app-preferences";
import { loadHistoryFolderState } from "@/lib/history-folder-store";

const loadHistoryFolderStateMock = vi.mocked(loadHistoryFolderState);

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
    expect(screen.getByText("辩论历史保存文件夹")).toBeInTheDocument();
    expect(screen.queryByText("默认模型")).not.toBeInTheDocument();
    expect(await screen.findByText("Dualens Histories")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新选择" })).toBeInTheDocument();
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
  });

  it("disables folder picking when the browser does not support directory access", async () => {
    loadHistoryFolderStateMock.mockResolvedValueOnce({
      status: "unsupported",
      folderName: null
    });

    renderSettingsPage();

    expect(await screen.findByText("当前浏览器不支持")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新选择" })).toBeDisabled();
  });
});
