import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getGitHubRepositoryConfig,
  isGitHubRepositoryPayload
} from "@/lib/github";

describe("github repository config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is explicitly unconfigured when repository env vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_OWNER", undefined);
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO", undefined);
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO_URL", undefined);

    expect(getGitHubRepositoryConfig()).toEqual({
      configured: false,
      owner: null,
      repo: null,
      repoUrl: null
    });
  });

  it("reads owner, repo, and repoUrl from explicit configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_OWNER", "example-owner");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO", "example-repo");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO_URL", "https://github.com/example-owner/example-repo");

    expect(getGitHubRepositoryConfig()).toEqual({
      configured: true,
      owner: "example-owner",
      repo: "example-repo",
      repoUrl: "https://github.com/example-owner/example-repo"
    });
  });

  it("reads repository config from a provided environment source", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_OWNER", undefined);
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO", undefined);
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO_URL", undefined);

    expect(
      getGitHubRepositoryConfig({
        NEXT_PUBLIC_GITHUB_OWNER: "client-owner",
        NEXT_PUBLIC_GITHUB_REPO: "client-repo",
        NEXT_PUBLIC_GITHUB_REPO_URL: "https://github.com/client-owner/client-repo"
      })
    ).toEqual({
      configured: true,
      owner: "client-owner",
      repo: "client-repo",
      repoUrl: "https://github.com/client-owner/client-repo"
    });
  });

  it("does not infer a repository url when repoUrl is omitted", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_OWNER", "example-owner");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO", "example-repo");
    vi.stubEnv("NEXT_PUBLIC_GITHUB_REPO_URL", undefined);

    expect(getGitHubRepositoryConfig()).toEqual({
      configured: false,
      owner: "example-owner",
      repo: "example-repo",
      repoUrl: null
    });
  });

  it("type guards the GitHub repository payload shape", () => {
    expect(isGitHubRepositoryPayload({ stargazers_count: 5422 })).toBe(true);
    expect(isGitHubRepositoryPayload({ stargazers_count: "5422" })).toBe(false);
    expect(isGitHubRepositoryPayload(null)).toBe(false);
  });
});
