type GitHubStarsCache = {
  stargazersCount: number;
  cachedAt: number;
};

let starsCache: GitHubStarsCache | null = null;

export function readGitHubStarsCache() {
  return starsCache;
}

export function writeGitHubStarsCache(stargazersCount: number, cachedAt: number) {
  starsCache = {
    stargazersCount,
    cachedAt
  };
}

export function resetGitHubStarsCacheForTests() {
  starsCache = null;
}
