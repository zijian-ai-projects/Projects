"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { workspaceNavItems } from "@/lib/workspace-nav";

function TaijiMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 shrink-0 text-[#111111]"
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Link
        href="/debate"
        className="rounded-[28px] border border-black/8 bg-white px-4 py-4 transition hover:border-black/12"
      >
        <div className="flex items-center gap-3">
          <TaijiMark />
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-[-0.04em] text-[#111111]">两仪决</div>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/45">dualens</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-black/58">
          围绕同一问题组织两种立场，让判断过程保持可见与平衡。
        </p>
      </Link>

      <nav aria-label="主导航" className="mt-8 space-y-2">
        {workspaceNavItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/debate" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex items-start gap-3 rounded-[24px] border px-3 py-3 transition",
                isActive
                  ? "border-black/12 bg-white text-black shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                  : "border-transparent bg-transparent text-black/68 hover:border-black/8 hover:bg-white/70"
              ].join(" ")}
            >
              <NavGlyph active={isActive} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-inherit">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-black/45">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[24px] border border-black/8 bg-white/80 px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-black/38">Workspace</p>
        <p className="mt-2 text-sm leading-6 text-black/58">
          当前先完成应用壳层与导航骨架，右侧页面将逐步接入完整产品结构。
        </p>
      </div>
    </div>
  );
}
