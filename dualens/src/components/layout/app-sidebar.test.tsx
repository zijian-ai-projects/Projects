import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
import { APP_LANGUAGE_STORAGE_KEY, AppPreferencesProvider } from "@/lib/app-preferences";

function renderSidebar() {
  return render(
    <AppPreferencesProvider>
      <AppSidebar />
    </AppPreferencesProvider>
  );
}

describe("workspace navigation copy", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the renamed five-item navigation set in order", () => {
    renderSidebar();

    const nav = screen.getByRole("navigation", { name: "主导航" });
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("aria-label"))
      .filter(Boolean);

    expect(labels).toEqual(["辩论", "辩论历史", "AI 服务商", "搜索引擎", "通用设置"]);
    expect(within(nav).getByRole("link", { name: "辩论" })).toHaveAttribute("href", "/app");
    expect(within(nav).getByRole("link", { name: "辩论历史" })).toHaveAttribute("href", "/history");
    expect(within(nav).getByRole("link", { name: "AI 服务商" })).toHaveAttribute("href", "/providers");
    expect(within(nav).getByRole("link", { name: "搜索引擎" })).toHaveAttribute("href", "/search-engines");
    expect(within(nav).getByRole("link", { name: "通用设置" })).toHaveAttribute("href", "/settings");
    expect(within(nav).getByRole("link", { name: "搜索引擎" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("一个问题，正反两面，证据可见")).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
  });

  it("uses the stored English global language", async () => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, "en");

    renderSidebar();

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Search engines" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByText("One question, two lenses, visible evidence")).toBeInTheDocument();
  });

  it("integrates the brand block and marks the taiji for slow counterclockwise rotation", () => {
    const { container } = renderSidebar();
    const taijiMark = container.querySelector("svg");
    const brandLink = taijiMark?.closest("a");

    expect(taijiMark).toHaveClass("animate-taiji-counterclockwise");
    expect(brandLink).toHaveAttribute("href", "/");
    expect(brandLink?.firstElementChild).toHaveClass("justify-center");
  });
});
