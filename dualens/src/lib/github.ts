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

type GitHubRepositoryEnvKey =
  | "NEXT_PUBLIC_GITHUB_OWNER"
  | "NEXT_PUBLIC_GITHUB_REPO"
  | "NEXT_PUBLIC_GITHUB_REPO_URL"
  | "GITHUB_OWNER"
  | "GITHUB_REPO"
  | "GITHUB_REPO_URL";

type GitHubRepositoryEnv = Partial<Record<GitHubRepositoryEnvKey, string | undefined>>;

function readGitHubRepositoryEnv(): GitHubRepositoryEnv {
  return {
    NEXT_PUBLIC_GITHUB_OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER,
    NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,
    NEXT_PUBLIC_GITHUB_REPO_URL: process.env.NEXT_PUBLIC_GITHUB_REPO_URL,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_REPO_URL: process.env.GITHUB_REPO_URL
  };
}

function readEnvValue(env: GitHubRepositoryEnv, name: GitHubRepositoryEnvKey) {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getGitHubRepositoryConfig(
  env: GitHubRepositoryEnv = readGitHubRepositoryEnv()
): GitHubRepositoryConfig {
  const owner = readEnvValue(env, "NEXT_PUBLIC_GITHUB_OWNER") ?? readEnvValue(env, "GITHUB_OWNER");
  const repo = readEnvValue(env, "NEXT_PUBLIC_GITHUB_REPO") ?? readEnvValue(env, "GITHUB_REPO");
  const repoUrl = readEnvValue(env, "NEXT_PUBLIC_GITHUB_REPO_URL") ?? readEnvValue(env, "GITHUB_REPO_URL");

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
