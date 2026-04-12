"use client";

import { useEffect, useMemo, useState } from "react";
import { getGitHubRepositoryConfig } from "@/lib/github";
import { useAppPreferences } from "@/lib/app-preferences";
import { getSiteCopy } from "@/locales/site-copy";

type GitHubStarsResponse = {
  configured: boolean;
  stargazersCount: number | null;
  formattedStars: string;
  stale: boolean;
};

function isGitHubStarsResponse(value: unknown): value is GitHubStarsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { configured?: unknown }).configured === "boolean" &&
    ((value as { stargazersCount?: unknown }).stargazersCount === null ||
      typeof (value as { stargazersCount?: unknown }).stargazersCount === "number") &&
    typeof (value as { formattedStars?: unknown }).formattedStars === "string" &&
    typeof (value as { stale?: unknown }).stale === "boolean"
  );
}

export function GitHubStarButton() {
  const { language } = useAppPreferences();
  const copy = getSiteCopy(language);
  const repositoryConfig = useMemo(() => getGitHubRepositoryConfig(), []);
  const [stars, setStars] = useState("--");
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = repositoryConfig.configured;

  useEffect(() => {
    let active = true;

    async function loadStars() {
      try {
        const response = await fetch("/api/github-stars");
        if (!response.ok) {
          throw new Error("Unable to load GitHub stars");
        }

        const payload: unknown = await response.json();
        if (active && isGitHubStarsResponse(payload)) {
          setStars(payload.formattedStars);
        }
      } catch {
        if (active) {
          setStars("--");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadStars();

    return () => {
      active = false;
    };
  }, []);

  const href = isConfigured ? repositoryConfig.repoUrl : "#";

  return (
    <a
      href={href}
      aria-disabled={isConfigured ? undefined : "true"}
      aria-label={`${copy.topbar.github} ${isLoading ? "loading" : stars}`}
      className={[
        "inline-flex h-10 items-center gap-2 rounded-[8px] border border-app-line bg-app-panel/82 px-3 text-xs font-medium text-app-strong shadow-app-soft backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
        isConfigured
          ? "hover:bg-app-soft"
          : "cursor-not-allowed opacity-70"
      ].join(" ")}
      target={isConfigured ? "_blank" : undefined}
      rel={isConfigured ? "noreferrer noopener" : undefined}
      title={isConfigured ? copy.topbar.github : copy.topbar.githubUnavailable}
      onClick={(event) => {
        if (!isConfigured) {
          event.preventDefault();
        }
      }}
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 .5a12 12 0 0 0-3.8 23.39c.6.11.82-.26.82-.58v-2.1c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.31-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23A11.48 11.48 0 0 1 12 5.91c1.02 0 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.23v3.31c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
      </svg>
      <span className="hidden sm:inline">{copy.topbar.github}</span>
      <span className="inline-flex min-w-[3.25rem] justify-center rounded-[7px] border border-app-line bg-app-soft px-2 py-1 tabular-nums text-app-muted">
        {isLoading ? "--" : stars}
      </span>
    </a>
  );
}
