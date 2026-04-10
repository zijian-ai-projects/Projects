import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn()
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

describe("AppSidebar", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/providers");
  });

  it("renders the four primary navigation links and marks the active route", () => {
    render(<AppSidebar />);

    expect(screen.getByRole("link", { name: "辩论页" })).toHaveAttribute("href", "/debate");
    expect(screen.getByRole("link", { name: "辩论历史页" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("link", { name: "AI 服务商" })).toHaveAttribute("href", "/providers");
    expect(screen.getByRole("link", { name: "通用设置" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: "AI 服务商" })).toHaveAttribute("aria-current", "page");
  });
});
