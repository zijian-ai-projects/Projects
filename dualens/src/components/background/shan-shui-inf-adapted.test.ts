import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SHAN_SHUI_INF_ATTRIBUTION,
  generateShanShuiStrip
} from "@/components/background/shan-shui-inf-adapted";

describe("generateShanShuiStrip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates deterministic SVG without using global Math.random", () => {
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("global random should not be used");
    });

    const first = generateShanShuiStrip({ variant: "home", seed: "fixed-seed" });
    const second = generateShanShuiStrip({ variant: "home", seed: "fixed-seed" });

    expect(first.svg).toEqual(second.svg);
    expect(first.seed).toBe("fixed-seed");
    expect(first.width).toBeGreaterThan(3000);
    expect(first.height).toBeGreaterThan(700);
  });

  it("caches repeated variant and seed generation to avoid rerender churn", () => {
    const first = generateShanShuiStrip({ variant: "home", seed: "cached-seed" });
    const second = generateShanShuiStrip({ variant: "home", seed: "cached-seed" });
    const differentVariant = generateShanShuiStrip({ variant: "workspace", seed: "cached-seed" });

    expect(second).toBe(first);
    expect(differentVariant).not.toBe(first);
  });

  it("ports shan-shui-inf mountain, tree, rock, and texture organization", () => {
    const strip = generateShanShuiStrip({ variant: "home", seed: "shape-seed" });

    expect(strip.svg).toContain('data-shan-shui-adapted="true"');
    expect(strip.svg).toContain('data-shan-shui-layer="far-mountains"');
    expect(strip.svg).toContain('data-shan-shui-layer="mid-mountains"');
    expect(strip.svg).toContain('data-shan-shui-layer="foreground-rocks"');
    expect(strip.svg).toContain('data-shan-shui-layer="tree-clusters"');
    expect(strip.svg).toContain('data-shan-shui-part="texture"');
    expect(strip.svg).toContain('data-shan-shui-tree=');
    expect(strip.svg).toContain('data-shan-shui-rock=');
    expect(strip.svg).not.toMatch(/taiji|yin|yang|ink-flow|ink-breath/i);
  });

  it("does not render broad abstract mist bands over the landscape", () => {
    const home = generateShanShuiStrip({ variant: "home", seed: "no-band-home" });
    const workspace = generateShanShuiStrip({ variant: "workspace", seed: "no-band-workspace" });

    expect(home.svg).not.toContain("NaN");
    expect(workspace.svg).not.toContain("NaN");
    expect(home.svg).not.toContain('data-shan-shui-part="mist"');
    expect(workspace.svg).not.toContain('data-shan-shui-part="mist"');
    expect(home.svg).not.toMatch(/stroke-width:(?:[6-9]\d|1\d\d)/);
    expect(workspace.svg).not.toMatch(/stroke-width:(?:[6-9]\d|1\d\d)/);
  });

  it("keeps the workspace strip visibly populated while remaining weaker than home", () => {
    const home = generateShanShuiStrip({ variant: "home", seed: "density-seed" });
    const workspace = generateShanShuiStrip({ variant: "workspace", seed: "density-seed" });

    const count = (svg: string, marker: string) => svg.match(new RegExp(marker, "g"))?.length ?? 0;

    expect(workspace.svg).toContain('data-shan-shui-variant="workspace" opacity="0.82"');
    expect(count(workspace.svg, "data-shan-shui-mountain=")).toBeGreaterThanOrEqual(14);
    expect(count(workspace.svg, "data-shan-shui-rock=")).toBeGreaterThanOrEqual(12);
    expect(count(workspace.svg, "data-shan-shui-tree=")).toBeGreaterThanOrEqual(28);
    expect(count(home.svg, "data-shan-shui-tree=")).toBeGreaterThan(count(workspace.svg, "data-shan-shui-tree="));
  });

  it("keeps generated landscape paint to white, black, gray, and transparent values", () => {
    const strip = generateShanShuiStrip({ variant: "workspace", seed: "palette-seed" });

    expect(strip.svg).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(strip.svg).not.toMatch(/\b(red|green|blue|yellow|orange|purple|brown|beige|tan)\b/i);
    expect(strip.svg).not.toMatch(/rgba\((?!0,0,0|255,255,255|100,100,100|120,120,120|160,160,160|200,200,200)/);
  });

  it("ships repository-level attribution for the adapted MIT source", () => {
    const notice = fs.readFileSync(path.resolve("THIRD_PARTY_NOTICES.md"), "utf8");

    expect(SHAN_SHUI_INF_ATTRIBUTION.name).toBe("shan-shui-inf");
    expect(SHAN_SHUI_INF_ATTRIBUTION.license).toBe("MIT");
    expect(SHAN_SHUI_INF_ATTRIBUTION.source).toContain("github.com/LingDong-/shan-shui-inf");
    expect(notice).toContain("shan-shui-inf");
    expect(notice).toContain("Copyright (c) 2018 Lingdong Huang");
    expect(notice).toContain("MIT License");
  });
});
