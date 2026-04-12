export type GitHubRepositoryConfig =
  | {
      configured: true;
      owner: string;
      repo: string;
      repoUrl: string;
    }
  | {
      configured: false;
      owner: string | null;
      repo: string | null;
      repoUrl: string | null;
    };

export type GitHubRepositoryPayload = {
  stargazers_count: number;
};

function readEnvValue(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getGitHubRepositoryConfig(): GitHubRepositoryConfig {
  const owner = readEnvValue("NEXT_PUBLIC_GITHUB_OWNER") ?? readEnvValue("GITHUB_OWNER");
  const repo = readEnvValue("NEXT_PUBLIC_GITHUB_REPO") ?? readEnvValue("GITHUB_REPO");
  const repoUrl = readEnvValue("NEXT_PUBLIC_GITHUB_REPO_URL") ?? readEnvValue("GITHUB_REPO_URL");

  if (!owner || !repo || !repoUrl) {
    return {
      configured: false,
      owner,
      repo,
      repoUrl
    };
  }

  return {
    configured: true,
    owner,
    repo,
    repoUrl
  };
}

export function isGitHubRepositoryPayload(value: unknown): value is GitHubRepositoryPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "stargazers_count" in value &&
    typeof (value as { stargazers_count?: unknown }).stargazers_count === "number" &&
    Number.isFinite((value as { stargazers_count: number }).stargazers_count)
  );
}
