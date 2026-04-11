import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionCard } from "@/components/common/section-card";

describe("SectionCard", () => {
  it("renders a section title, description, and content", () => {
    render(
      <SectionCard title="模型与参数区" description="设置当前辩论所使用的模型与策略。">
        <div>body</div>
      </SectionCard>
    );

    expect(screen.getByRole("heading", { level: 2, name: "模型与参数区" })).toBeInTheDocument();
    expect(screen.getByText("设置当前辩论所使用的模型与策略。")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("does not reserve body spacing when only an action is rendered", () => {
    render(
      <SectionCard title="操作区" description="确认当前模型与搜索引擎后，正式启动辩论。" action={<button type="button">开始辩论</button>}>
        {null}
      </SectionCard>
    );

    const section = screen.getByRole("heading", { level: 2, name: "操作区" }).closest("section");
    const header = section?.firstElementChild;

    expect(header).toContainElement(screen.getByRole("button", { name: "开始辩论" }));
    expect(header).not.toHaveClass("mb-5");
  });
});
