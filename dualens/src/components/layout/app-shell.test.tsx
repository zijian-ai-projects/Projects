import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/debate")
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

import { AppShell } from "@/components/layout/app-shell";

describe("AppShell", () => {
  it("collapses the workspace sidebar to icons and restores the expanded menu", () => {
    const { container } = render(
      <AppShell>
        <div>Debate content</div>
      </AppShell>
    );

    const aside = container.querySelector("aside");
    const nav = screen.getByRole("navigation", { name: "主导航" });

    expect(aside).toHaveClass("w-[280px]");
    expect(within(nav).getByText("配置问题、角色与模型")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "收起菜单" }));

    expect(aside).toHaveClass("w-[88px]");
    expect(screen.getByRole("button", { name: "展开菜单" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "辩论" })).toHaveAttribute("href", "/debate");
    expect(within(nav).queryByText("配置问题、角色与模型")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "展开菜单" }));

    expect(aside).toHaveClass("w-[280px]");
    expect(within(nav).getByText("配置问题、角色与模型")).toBeInTheDocument();
  });
});
