import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import ProductPage from "@/app/(workspace)/product/page";

describe("ProductPage", () => {
  it("renders the product entry page with taiji and ink language", () => {
    const { container } = render(<ProductPage />);

    expect(screen.getByRole("heading", { level: 1, name: "两仪决" })).toBeInTheDocument();
    expect(screen.getByText("共证衡辩")).toBeInTheDocument();
    expect(screen.getByText("隔证三辩")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入辩论" })).toHaveAttribute("href", "/debate");

    const taiji = container.querySelector("svg");
    expect(taiji).toHaveClass("animate-taiji-counterclockwise");
    expect(screen.getByTestId("product-ink-mark")).toBeInTheDocument();
  });
});
