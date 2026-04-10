import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/history-folder-store", () => ({
  loadHistoryFolderState: vi.fn(async () => ({
    status: "authorized",
    folderName: "Dualens Histories"
  })),
  chooseHistoryFolder: vi.fn()
}));

import SettingsPage from "@/app/(workspace)/settings/page";
import { loadHistoryFolderState } from "@/lib/history-folder-store";

const loadHistoryFolderStateMock = vi.mocked(loadHistoryFolderState);

describe("SettingsPage", () => {
  beforeEach(() => {
    loadHistoryFolderStateMock.mockResolvedValue({
      status: "authorized",
      folderName: "Dualens Histories"
    });
  });

  it("renders a single history-folder settings card", async () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "通用设置" })).toBeInTheDocument();
    expect(screen.getByText("辩论历史保存文件夹")).toBeInTheDocument();
    expect(screen.queryByText("语言设置")).not.toBeInTheDocument();
    expect(screen.queryByText("默认模型")).not.toBeInTheDocument();
    expect(await screen.findByText("Dualens Histories")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新选择" })).toBeInTheDocument();
  });

  it("shows the choose action for an unselected folder state", async () => {
    loadHistoryFolderStateMock.mockResolvedValueOnce({
      status: "unselected",
      folderName: null
    });

    render(<SettingsPage />);

    expect(await screen.findByRole("button", { name: "选择文件夹" })).toBeInTheDocument();
    expect(screen.getAllByText("未选择").length).toBeGreaterThan(0);
  });

  it("disables folder picking when the browser does not support directory access", async () => {
    loadHistoryFolderStateMock.mockResolvedValueOnce({
      status: "unsupported",
      folderName: null
    });

    render(<SettingsPage />);

    expect(await screen.findByText("当前浏览器不支持")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新选择" })).toBeDisabled();
  });
});
