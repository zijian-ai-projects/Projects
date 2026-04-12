"use client";

import Link from "next/link";
import { GitHubStarButton } from "@/components/topbar/github-star-button";
import { LanguageSwitcher } from "@/components/topbar/language-switcher";
import { ThemeSwitcher } from "@/components/topbar/theme-switcher";
import { useAppPreferences } from "@/lib/app-preferences";
import { getSiteCopy } from "@/locales/site-copy";

export function TopbarActions({
  showStartButton = false,
  className
}: {
  showStartButton?: boolean;
  className?: string;
}) {
  const { language } = useAppPreferences();
  const copy = getSiteCopy(language);

  return (
    <div className={["flex flex-wrap items-center justify-end gap-2", className ?? ""].filter(Boolean).join(" ")}>
      <LanguageSwitcher />
      <ThemeSwitcher />
      <GitHubStarButton />
      {showStartButton ? (
        <Link
          href="/app"
          className="inline-flex h-10 items-center justify-center rounded-[8px] border border-app-strong bg-app-strong px-4 text-sm font-medium text-app-inverse transition hover:bg-app-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
        >
          {copy.nav.start}
        </Link>
      ) : null}
    </div>
  );
}
