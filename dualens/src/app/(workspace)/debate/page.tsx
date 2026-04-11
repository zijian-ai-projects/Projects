"use client";

import { createSession } from "@/app/session-client";
import { PageHeader } from "@/components/common/page-header";
import { SessionShell } from "@/components/session-shell";
import { useAppPreferences } from "@/lib/app-preferences";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

export default function DebatePage() {
  const { language } = useAppPreferences();
  const copy = getWorkspaceCopy(language);

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title={copy.pages.debate.title}
        description={copy.pages.debate.description}
      />
      <SessionShell createSession={createSession} uiLanguage={language} />
    </div>
  );
}
