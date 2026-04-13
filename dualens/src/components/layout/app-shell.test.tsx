import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/app")
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

vi.mock("@/components/background/ink-landscape-background", () => ({
  InkLandscapeBackground: ({ variant }: { variant: string }) => (
    <div data-testid="ink-landscape-background" data-variant={variant} />
  )
}));

import { AppShell } from "@/components/layout/app-shell";
import { RootProviders } from "@/app/providers";

describe("AppShell", () => {
  it("collapses the workspace sidebar to icons and restores the expanded menu", () => {
    const { container } = render(
      <RootProviders>
        <AppShell>
          <div>Debate content</div>
        </AppShell>
      </RootProviders>
    );

    const aside = container.querySelector("aside");
    const nav = screen.getByRole("navigation", { name: "主导航" });

    expect(aside).toHaveClass("w-[280px]");
    expect(container.querySelector('[data-testid="workspace-ink-background"]')).not.toBeInTheDocument();
    expect(within(nav).getByText("配置问题、角色与模型")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "收起菜单" });
    const toggleIcon = screen.getByTestId("sidebar-toggle-icon");
    const toggleDock = screen.getByTestId("sidebar-toggle-dock");

    expect(toggleDock).toHaveClass("absolute", "left-full", "top-4", "translate-x-1/2");
    expect(toggle).not.toHaveClass("fixed");
    expect(toggle).toHaveClass("border", "border-app-line");
    expect(toggle).not.toHaveClass("shadow-[0_8px_24px_rgba(0,0,0,0.06)]");
    expect(toggle).toHaveClass("bg-app/75");
    expect(toggle).not.toHaveTextContent("<");
    expect(toggle).not.toHaveTextContent(">");
    expect(toggleIcon).toHaveClass("before:absolute");
    expect(toggleIcon).not.toHaveClass("after:absolute");

    fireEvent.click(toggle);

    expect(aside).toHaveClass("w-[88px]");
    expect(screen.getByTestId("sidebar-toggle-dock")).toHaveClass(
      "absolute",
      "left-full",
      "translate-x-1/2"
    );
    expect(screen.getByRole("button", { name: "展开菜单" })).not.toHaveClass("fixed");
    expect(within(nav).getByRole("link", { name: "辩论" })).toHaveAttribute("href", "/app");
    expect(within(nav).queryByText("配置问题、角色与模型")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "展开菜单" }));

    expect(aside).toHaveClass("w-[280px]");
    expect(within(nav).getByText("配置问题、角色与模型")).toBeInTheDocument();
  });
});
