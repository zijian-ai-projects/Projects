import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/history-folder-store", () => ({
  loadHistoryFolderState: vi.fn(async () => ({
    status: "authorized",
    folderName: "Dualens Histories"
  })),
  chooseHistoryFolder: vi.fn()
}));

import SettingsPage from "@/app/(workspace)/settings/page";

describe("SettingsPage", () => {
  it("renders a single history-folder settings card", async () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "通用设置" })).toBeInTheDocument();
    expect(screen.getByText("辩论历史保存文件夹")).toBeInTheDocument();
    expect(screen.queryByText("语言设置")).not.toBeInTheDocument();
    expect(screen.queryByText("默认模型")).not.toBeInTheDocument();
    expect(await screen.findByText("Dualens Histories")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新选择" })).toBeInTheDocument();
  });
});
