"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppPreferences } from "@/lib/app-preferences";
import { getWorkspaceCopy } from "@/lib/workspace-copy";

const navItems = [
  { href: "/debate", key: "debate" },
  { href: "/history", key: "history" },
  { href: "/providers", key: "providers" },
  { href: "/search-engines", key: "searchEngines" },
  { href: "/settings", key: "settings" }
] as const;

function TaijiMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 shrink-0 animate-taiji-counterclockwise text-[#111111]"
      fill="none"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="58" className="fill-white stroke-black/15" strokeWidth="1.5" />
      <path className="fill-black" d="M60 2a58 58 0 0 1 0 116a29 29 0 0 0 0-58a29 29 0 0 1 0-58Z" />
      <circle cx="60" cy="31" r="10" className="fill-white" />
      <circle cx="60" cy="89" r="10" className="fill-black" />
    </svg>
  );
}

function NavGlyph({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex h-8 w-8 items-center justify-center rounded-2xl border transition",
        active ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/75"
      ].join(" ")}
    >
      <span className={["h-2.5 w-2.5 rounded-full", active ? "bg-white" : "bg-black/60"].join(" ")} />
    </span>
  );
}

export function AppSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { language } = useAppPreferences();
  const copy = getWorkspaceCopy(language);

  return (
    <div className={["flex h-full flex-col py-6", collapsed ? "px-3" : "px-5"].join(" ")}>
      <Link
        href="/debate"
        aria-label="两仪决"
        title={collapsed ? "两仪决" : undefined}
        className={[
          "rounded-[28px] py-4 transition hover:bg-white/55",
          collapsed ? "flex justify-center px-0" : "px-4"
        ].join(" ")}
      >
        <div className={["flex items-center gap-3", collapsed ? "justify-center" : "justify-center pl-2"].join(" ")}>
          <TaijiMark />
          {collapsed ? null : (
            <div className="min-w-0">
              <div className="text-lg font-semibold tracking-[-0.04em] text-[#111111]">两仪决</div>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/45">dualens</p>
            </div>
          )}
        </div>
        {collapsed ? null : (
          <p className="mt-4 text-sm leading-6 text-black/58">
            {copy.brandTagline}
          </p>
        )}
      </Link>

      <nav aria-label={copy.navAriaLabel} className={["space-y-2", collapsed ? "mt-8" : "mt-8"].join(" ")}>
        {navItems.map((item) => {
          const itemCopy = copy.nav[item.key];
          const isActive =
            pathname === item.href || (item.href !== "/debate" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={itemCopy.label}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? itemCopy.label : undefined}
              className={[
                "group relative flex rounded-[24px] border py-3 transition",
                collapsed ? "items-center justify-center px-0" : "items-start gap-3 px-3",
                isActive
                  ? "border-black/12 bg-white text-black shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                  : "border-transparent bg-transparent text-black/68 hover:border-black/8 hover:bg-white/70"
              ].join(" ")}
            >
              <NavGlyph active={isActive} />
              {collapsed ? null : (
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-inherit">{itemCopy.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-black/45">{itemCopy.description}</span>
                </span>
              )}
              {collapsed ? (
                <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-black shadow-[0_8px_22px_rgba(0,0,0,0.08)] group-hover:block group-focus-visible:block">
                  {itemCopy.label}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {collapsed ? null : (
        <div className="mt-auto rounded-[24px] border border-black/8 bg-white/80 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-black/38">{copy.workspaceLabel}</p>
          <p className="mt-2 text-sm leading-6 text-black/58">
            {copy.workspaceDescription}
          </p>
        </div>
      )}
    </div>
  );
}
