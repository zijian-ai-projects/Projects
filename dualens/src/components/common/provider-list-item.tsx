import type { ReactNode } from "react";
import { StatusTag } from "@/components/common/status-tag";

export function ProviderListItem({
  name,
  configured,
  active,
  icon,
  onClick
}: {
  name: string;
  configured: boolean;
  active: boolean;
  icon: ReactNode;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-left transition",
        active
          ? "border-black/12 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.03)]"
          : "border-transparent bg-transparent hover:border-black/8 hover:bg-white/70"
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-black">
          {icon}
        </span>
        <span>
          <span className="block text-sm font-medium text-black">{name}</span>
          <span className="mt-1 block text-xs text-black/45">{configured ? "已接入" : "未配置"}</span>
        </span>
      </span>
      <StatusTag tone={configured ? "success" : "neutral"}>{configured ? "已配置" : "未配置"}</StatusTag>
    </button>
  );
}
