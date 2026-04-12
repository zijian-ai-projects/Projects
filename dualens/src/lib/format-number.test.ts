import { describe, expect, it } from "vitest";
import { formatStarCount } from "@/lib/format-number";

describe("formatStarCount", () => {
  it("formats GitHub star counts with a stable thousands separator", () => {
    expect(formatStarCount(0)).toBe("0");
    expect(formatStarCount(5422)).toBe("5,422");
    expect(formatStarCount(1280000)).toBe("1,280,000");
  });

  it("uses a placeholder for missing or invalid counts", () => {
    expect(formatStarCount(null)).toBe("--");
    expect(formatStarCount(undefined)).toBe("--");
    expect(formatStarCount(Number.NaN)).toBe("--");
    expect(formatStarCount(-1)).toBe("--");
  });
});
