import "@testing-library/jest-dom/vitest";

import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect
}));

describe("HomePage", () => {
  it("redirects the root route to /debate", async () => {
    const { default: HomePage } = await import("@/app/page");

    HomePage();

    expect(redirect).toHaveBeenCalledWith("/debate");
  });
});
