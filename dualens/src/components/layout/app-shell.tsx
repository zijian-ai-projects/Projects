import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppPreferencesProvider } from "@/lib/app-preferences";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppPreferencesProvider>
      <div className="min-h-screen bg-[#f3f3f1] text-[#161616]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
          <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-black/8 bg-[#fbfbfa] lg:block">
            <AppSidebar />
          </aside>
          <main className="min-w-0 flex-1">
            <div className="mx-auto min-h-screen w-full max-w-[1240px]">{children}</div>
          </main>
        </div>
      </div>
    </AppPreferencesProvider>
  );
}
