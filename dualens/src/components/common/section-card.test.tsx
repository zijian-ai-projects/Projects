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
});
