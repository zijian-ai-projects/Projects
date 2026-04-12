import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/github-stars/route";
import { resetGitHubStarsCacheForTests } from "@/lib/github-stars-cache";

describe("GET /api/github-stars", () => {
  beforeEach(() => {
    resetGitHubStarsCacheForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns a safe unconfigured response without calling GitHub", async () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_OWNER", undefined);
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO", undefined);
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO_URL", undefined);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET();
    const payload = await response.json();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(payload).toEqual({
      configured: false,
      stargazersCount: null,
      formattedStars: "--",
      stale: false
    });
  });

  it("fetches GitHub stars through the server and formats the count", async () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_OWNER", "example-owner");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO", "example-repo");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO_URL", "https://github.com/example-owner/example-repo");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ stargazers_count: 5422 }), { status: 200 })
    );

    const response = await GET();
    const payload = await response.json();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/example-owner/example-repo",
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "application/vnd.github+json"
        })
      })
    );
    expect(payload).toEqual({
      configured: true,
      stargazersCount: 5422,
      formattedStars: "5,422",
      stale: false
    });
  });

  it("falls back to the last successful cache when GitHub fails later", async () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_OWNER", "example-owner");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO", "example-repo");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO_URL", "https://github.com/example-owner/example-repo");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ stargazers_count: 5422 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("rate limited", { status: 403 }));

    await GET();
    const response = await GET();
    const payload = await response.json();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(payload).toEqual({
      configured: true,
      stargazersCount: 5422,
      formattedStars: "5,422",
      stale: true
    });
  });
});
