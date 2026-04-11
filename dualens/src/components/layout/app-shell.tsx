"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppPreferencesProvider } from "@/lib/app-preferences";
import { useAppPreferences } from "@/lib/app-preferences";
import { DebateQuestionDraftProvider } from "@/lib/debate-question-draft";
import { DebateWorkspaceStateProvider } from "@/lib/debate-workspace-state";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppPreferencesProvider>
      <DebateWorkspaceStateProvider>
        <DebateQuestionDraftProvider>
          <WorkspaceFrame>{children}</WorkspaceFrame>
        </DebateQuestionDraftProvider>
      </DebateWorkspaceStateProvider>
    </AppPreferencesProvider>
  );
}

function WorkspaceFrame({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { language } = useAppPreferences();
  const copy = getWorkspaceCopy(language);

  return (
    <div className="min-h-screen bg-[#f3f3f1] text-[#161616]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside
          className={[
            "sticky top-0 hidden h-screen shrink-0 border-r border-black/8 bg-[#fbfbfa] transition-[width] duration-200 lg:block",
            sidebarCollapsed ? "w-[88px]" : "w-[280px]"
          ].join(" ")}
        >
          <AppSidebar collapsed={sidebarCollapsed} />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto min-h-screen w-full max-w-[1240px]">
            <div className="px-6 pt-6 lg:px-10">
              <button
                type="button"
                aria-label={sidebarCollapsed ? copy.expandSidebar : copy.collapseSidebar}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-sm font-semibold text-black transition hover:border-black/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15"
                onClick={() => setSidebarCollapsed((current) => !current)}
              >
                {sidebarCollapsed ? ">" : "<"}
              </button>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
