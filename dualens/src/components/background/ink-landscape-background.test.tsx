import "@testing-library/jest-dom/vitest";

import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InkLandscapeBackground } from "@/components/background/ink-landscape-background";

describe("InkLandscapeBackground", () => {
  it("renders a layered home ink landscape without becoming interactive content", () => {
    render(<InkLandscapeBackground variant="home" />);

    const background = screen.getByTestId("ink-landscape-background");

    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveAttribute("data-variant", "home");
    expect(background).toHaveClass("pointer-events-none", "fixed", "inset-0", "z-0");
    expect(background.querySelectorAll('[data-shan-shui-strip="home"]')).toHaveLength(2);
    expect(background.querySelector('[data-ink-layer="scroll-track"]')).toBeInTheDocument();
    expect(background.querySelector('[data-ink-layer="paper"]')).toBeInTheDocument();
    expect(background.querySelector('[data-shan-shui-layer="far-mountains"]')).toBeInTheDocument();
    expect(background.querySelector('[data-shan-shui-layer="mid-mountains"]')).toBeInTheDocument();
    expect(background.querySelector('[data-shan-shui-layer="foreground-rocks"]')).toBeInTheDocument();
    expect(background.querySelector('[data-shan-shui-layer="tree-clusters"]')).toBeInTheDocument();
    expect(background.querySelector('[data-shan-shui-layer="mist"]')).toBeInTheDocument();
    expect(background.querySelector('[data-ink-layer="reading-reserve"]')).toBeInTheDocument();
    expect(background.querySelector('[data-ink-layer="taiji-flow"]')).not.toBeInTheDocument();
    expect(background.querySelector('[data-ink-layer="ink-breath"]')).not.toBeInTheDocument();
    expect(background.querySelectorAll("[data-shan-shui-tree]")).not.toHaveLength(0);
  });

  it("renders the workspace variant with an explicit readability veil", () => {
    render(<InkLandscapeBackground variant="workspace" />);

    const background = screen.getByTestId("ink-landscape-background");

    expect(background).toHaveAttribute("data-variant", "workspace");
    expect(background).toHaveClass("ink-landscape--workspace");
    expect(background.querySelectorAll('[data-shan-shui-strip="workspace"]')).toHaveLength(2);
    expect(background.querySelector('[data-shan-shui-layer="far-mountains"]')).toBeInTheDocument();
    expect(background.querySelector('[data-shan-shui-layer="tree-clusters"]')).toBeInTheDocument();
    expect(background.querySelector('[data-shan-shui-layer="foreground-rocks"]')).toBeInTheDocument();
    expect(background.querySelector('[data-ink-layer="workspace-veil"]')).toBeInTheDocument();
    expect(background.querySelector('[data-ink-layer="workspace-quiet-zone"]')).toBeInTheDocument();
  });

  it("keeps the light theme background palette white and grayscale", () => {
    const globalsCss = fs.readFileSync(path.resolve("src/app/globals.css"), "utf8");

    expect(globalsCss).toContain("--color-app: 255 255 255;");
    expect(globalsCss).toContain("--color-app-panel: 255 255 255;");
    expect(globalsCss).toContain("--color-app-card: 255 255 255;");
    expect(globalsCss).toContain("--color-app-soft: 246 246 246;");
    expect(globalsCss).toContain("--color-ink-landscape: 0 0 0;");
    expect(globalsCss).toContain("shan-shui-scroll");
    expect(globalsCss).toContain("prefers-reduced-motion: reduce");
    expect(globalsCss).toContain("--shan-shui-landscape-opacity: 0.58;");
    expect(globalsCss).toContain("--ink-workspace-quiet-opacity: 0.56;");
    expect(globalsCss).not.toContain("--ink-flow-opacity");
    expect(globalsCss).not.toContain("ink-flow-drift");
    expect(globalsCss).not.toContain("ink-breath");
  });
});
