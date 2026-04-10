import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SettingsPage from "@/app/(workspace)/settings/page";

describe("SettingsPage", () => {
  it("renders grouped general settings modules", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "通用设置" })).toBeInTheDocument();
    expect(screen.getByText("语言设置")).toBeInTheDocument();
    expect(screen.getByText("默认模型")).toBeInTheDocument();
    expect(screen.getByText("默认辩论角色风格")).toBeInTheDocument();
    expect(screen.getByText("历史记录保存策略")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除缓存" })).toBeInTheDocument();
  });
});
