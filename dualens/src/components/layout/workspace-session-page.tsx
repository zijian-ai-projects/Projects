"use client";

import { useEffect } from "react";
import { createSession } from "@/app/session-client";
import { PageHeader } from "@/components/common/page-header";
import { SessionShell } from "@/components/session-shell";
import { useAppPreferences } from "@/lib/app-preferences";
import type { UiLanguage } from "@/lib/types";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

export function WorkspaceSessionPage({
  initialUiLanguage
}: {
  initialUiLanguage: UiLanguage | null;
}) {
  const { language, setLanguage } = useAppPreferences();
  const copy = getWorkspaceCopy(language);

  useEffect(() => {
    if (initialUiLanguage) {
      setLanguage(initialUiLanguage);
    }
  }, [initialUiLanguage, setLanguage]);

  return (
    <div className="relative isolate space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={copy.pages.debate.title}
        description={copy.pages.debate.description}
      />
      <div data-testid="workspace-session-content" className="relative z-10">
        <SessionShell createSession={createSession} uiLanguage={language} />
      </div>
    </div>
  );
}
