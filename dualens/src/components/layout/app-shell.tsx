"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { InkLandscapeBackground } from "@/components/background/ink-landscape-background";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAppPreferences } from "@/lib/app-preferences";
import { DebateQuestionDraftProvider } from "@/lib/debate-question-draft";
import { DebateWorkspaceStateProvider } from "@/lib/debate-workspace-state";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DebateWorkspaceStateProvider>
      <DebateQuestionDraftProvider>
        <WorkspaceFrame>{children}</WorkspaceFrame>
      </DebateQuestionDraftProvider>
    </DebateWorkspaceStateProvider>
  );
}

function WorkspaceFrame({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { language } = useAppPreferences();
  const copy = getWorkspaceCopy(language);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-app text-app-foreground">
      <InkLandscapeBackground variant="workspace" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px]">
        <div
          className={[
            "relative z-20 hidden h-screen shrink-0 transition-[width] duration-200 lg:block",
            sidebarCollapsed ? "w-[88px]" : "w-[280px]"
          ].join(" ")}
        >
          <aside
            className={[
              "sticky top-0 h-screen border-r border-app-line bg-app-panel transition-[width] duration-200",
              sidebarCollapsed ? "w-[88px]" : "w-[280px]"
            ].join(" ")}
          >
            <AppSidebar collapsed={sidebarCollapsed} />
          </aside>
          <div data-testid="sidebar-toggle-dock" className="absolute left-full top-4 z-50 translate-x-1/2">
            <button
              type="button"
              aria-label={sidebarCollapsed ? copy.expandSidebar : copy.collapseSidebar}
              className="inline-flex h-9 w-10 items-center justify-center rounded-[8px] border border-app-line bg-app/75 text-app-strong backdrop-blur transition-colors hover:bg-app-panel/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              <span
                data-testid="sidebar-toggle-icon"
                aria-hidden="true"
                className="relative h-5 w-5 before:absolute before:left-1/2 before:top-0 before:h-5 before:w-px before:-translate-x-1/2 before:bg-current before:content-['']"
              />
            </button>
          </div>
        </div>
        <main className="min-w-0 flex-1">
          <div className="mx-auto min-h-screen w-full max-w-[1240px]">
            <div aria-hidden="true" className="px-6 pt-6 lg:px-10">
              <div className="h-9" />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
