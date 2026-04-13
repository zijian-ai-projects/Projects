import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EnglishProductPage from "@/app/en/page";
import HomePage from "@/app/page";
import ChineseProductPage from "@/app/zh/page";
import { RootProviders } from "@/app/providers";
import { APP_LANGUAGE_STORAGE_KEY } from "@/lib/app-preferences";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect
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

describe("product entry routes", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          configured: false,
          stargazersCount: null,
          formattedStars: "--",
          stale: false
        }),
        { status: 200 }
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
  });

  it("renders the redesigned landing page at the root route", async () => {
    render(
      <RootProviders>
        <HomePage />
      </RootProviders>
    );

    expect(screen.getByRole("heading", { level: 1, name: "两仪决" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "让每个复杂问题，都经过两种视角的审视。" })).toBeInTheDocument();
    expect(screen.getByText("不是普通问答，是双视角决策框架。")).toBeInTheDocument();
    expect(screen.getByText("输入问题")).toBeInTheDocument();
    expect(screen.getByText("投资判断")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "立即开始" })).toHaveAttribute("href", "/app");
    expect(screen.getAllByRole("link", { name: "开始使用" })[0]).toHaveAttribute("href", "/app");
    expect(screen.getByTestId("ink-landscape-background")).toHaveAttribute("data-variant", "home");
    expect(screen.getByRole("link", { name: /Star on GitHub/ })).toHaveAttribute("aria-disabled", "true");

    await waitFor(() => {
      expect(screen.getByText("--")).toBeInTheDocument();
    });
  });

  it("keeps use-case cards compact and visually centered inside the scenario panel", () => {
    render(
      <RootProviders>
        <HomePage />
      </RootProviders>
    );

    const scenarioCard = screen.getByText("复杂选择").closest("div");

    expect(scenarioCard).toHaveClass("min-h-[5.75rem]");
    expect(scenarioCard).toHaveClass("items-center");
    expect(scenarioCard).toHaveClass("justify-center");
    expect(scenarioCard).toHaveClass("text-center");
  });

  it("uses the shared language preference for the landing page", async () => {
    render(
      <RootProviders>
        <HomePage />
      </RootProviders>
    );

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "Let every complex question face two disciplined lenses." })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Start now" })).toHaveAttribute("href", "/app");
    expect(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe("en");
  });

  it("redirects /product back to the root product introduction", async () => {
    const { default: ProductPage } = await import("@/app/product/page");

    ProductPage();

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders the Chinese product page from the multi-page worktree at /zh", () => {
    render(
      <RootProviders>
        <ChineseProductPage />
      </RootProviders>
    );

    expect(screen.getByRole("heading", { level: 1, name: "两仪决" })).toBeInTheDocument();
    expect(screen.getByText("不是普通问答，是双视角决策框架。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "立即开始" })).toHaveAttribute("href", "/app");
    expect(screen.getByTestId("ink-landscape-background")).toHaveAttribute("data-variant", "home");
  });

  it("renders the English product page from the same structure at /en", () => {
    render(
      <RootProviders>
        <EnglishProductPage />
      </RootProviders>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Dualens" })).toBeInTheDocument();
    expect(screen.getByText("Not a normal chatbot. A two-lens decision framework.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start now" })).toHaveAttribute("href", "/app");
    expect(screen.getByTestId("ink-landscape-background")).toHaveAttribute("data-variant", "home");
  });
});
