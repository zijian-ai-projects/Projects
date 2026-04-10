import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DebatePage from "@/app/(workspace)/debate/page";

describe("DebatePage", () => {
  it("renders the new formal debate-page sections", () => {
    render(<DebatePage />);

    expect(screen.getByRole("heading", { level: 1, name: "辩论" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "问题输入区" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "双角色配置区" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "模型与参数区" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "操作区" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始辩论" })).toBeInTheDocument();
  });
});
