import { NextResponse } from "next/server";
import { formatStarCount } from "@/lib/format-number";
import {
  getGitHubRepositoryConfig,
  isGitHubRepositoryPayload
} from "@/lib/github";
import {
  readGitHubStarsCache,
  writeGitHubStarsCache
} from "@/lib/github-stars-cache";

const GITHUB_STARS_CACHE_TTL_MS = process.env.NODE_ENV === "test" ? 0 : 1000 * 60 * 10;

function createStarsPayload({
  configured,
  stale,
  stargazersCount
}: {
  configured: boolean;
  stale: boolean;
  stargazersCount: number | null;
}) {
  return {
    configured,
    stargazersCount,
    formattedStars: formatStarCount(stargazersCount),
    stale
  };
}

export async function GET() {
  const repositoryConfig = getGitHubRepositoryConfig();

  if (!repositoryConfig.configured) {
    return NextResponse.json(
      createStarsPayload({
        configured: false,
        stale: false,
        stargazersCount: null
      })
    );
  }

  const now = Date.now();
  const starsCache = readGitHubStarsCache();
  if (starsCache && now - starsCache.cachedAt < GITHUB_STARS_CACHE_TTL_MS) {
    return NextResponse.json(
      createStarsPayload({
        configured: true,
        stale: false,
        stargazersCount: starsCache.stargazersCount
      })
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repositoryConfig.owner}/${repositoryConfig.repo}`,
      {
        headers: {
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28"
        },
        next: {
          revalidate: 600
        }
      }
    );

    if (!response.ok) {
      throw new Error("GitHub repository request failed");
    }

    const payload: unknown = await response.json();
    if (!isGitHubRepositoryPayload(payload)) {
      throw new Error("Invalid GitHub repository response");
    }

    writeGitHubStarsCache(payload.stargazers_count, now);

    return NextResponse.json(
      createStarsPayload({
        configured: true,
        stale: false,
        stargazersCount: payload.stargazers_count
      })
    );
  } catch {
    const fallbackCache = readGitHubStarsCache();

    return NextResponse.json(
      createStarsPayload({
        configured: true,
        stale: Boolean(fallbackCache),
        stargazersCount: fallbackCache?.stargazersCount ?? null
      })
    );
  }
}
