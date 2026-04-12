import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/components/common/page-header";

describe("PageHeader", () => {
  it("renders a page title and supporting description", () => {
    render(<PageHeader title="AI 服务商" description="配置各模型提供方的接入参数。" />);

    expect(screen.getByRole("heading", { level: 1, name: "AI 服务商" })).toBeInTheDocument();
    expect(screen.getByText("配置各模型提供方的接入参数。")).toBeInTheDocument();
  });
});
