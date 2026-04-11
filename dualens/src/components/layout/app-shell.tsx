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
    <div className="relative min-h-screen bg-[#f3f3f1] text-[#161616]">
      <div
        aria-hidden="true"
        data-testid="workspace-ink-background"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <svg
          aria-hidden="true"
          className="absolute left-[-5rem] top-[-3rem] h-80 w-80 animate-taiji-counterclockwise text-black/[0.045]"
          fill="none"
          viewBox="0 0 120 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="60" cy="60" r="56" className="stroke-current" strokeWidth="1.25" />
          <path
            className="fill-current"
            d="M60 4a56 56 0 0 1 0 112a28 28 0 0 0 0-56a28 28 0 0 1 0-56Z"
          />
          <circle cx="60" cy="32" r="9" className="fill-[#f3f3f1]" />
          <circle cx="60" cy="88" r="9" className="fill-current" />
        </svg>
        <svg
          aria-hidden="true"
          className="absolute right-[-4rem] top-[12rem] h-72 w-72 text-black/[0.035]"
          fill="none"
          viewBox="0 0 240 240"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M28 124c32-26 53-31 82-13s53 19 100-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="16"
          />
          <path
            d="M43 162c21-11 45-9 70 5s51 17 87 4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px]">
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
