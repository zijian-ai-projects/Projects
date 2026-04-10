import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/search-engines")
}));

vi.mock("next/navigation", () => ({
  usePathname
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

import { AppSidebar } from "@/components/layout/app-sidebar";

describe("workspace navigation copy", () => {
  it("renders the renamed five-item navigation set in order", () => {
    render(<AppSidebar />);

    const labels = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("aria-label"))
      .filter(Boolean);

    expect(labels).toEqual(["辩论", "辩论历史", "AI 服务商", "搜索引擎", "通用设置"]);
    expect(screen.getByRole("link", { name: "搜索引擎" })).toHaveAttribute("aria-current", "page");
  });
});
