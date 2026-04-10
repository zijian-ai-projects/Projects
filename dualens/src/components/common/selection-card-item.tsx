import type {
  KeyboardEventHandler,
  ReactNode,
  RefCallback
} from "react";
import { StatusTag } from "@/components/common/status-tag";

export function SelectionCardItem({
  name,
  configured,
  active,
  icon,
  tabIndex,
  onClick,
  onKeyDown,
  buttonRef
}: {
  name: string;
  configured: boolean;
  active: boolean;
  icon: ReactNode;
  tabIndex: number;
  onClick(): void;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  buttonRef?: RefCallback<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={name}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={[
        "relative flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left transition",
        active
          ? "border-black/14 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.03)]"
          : "border-black/8 bg-white/70 hover:border-black/12 hover:bg-white"
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border transition",
          active ? "border-black bg-white" : "border-black/18 bg-white"
        ].join(" ")}
      >
        <span className={["h-2 w-2 rounded-full", active ? "bg-black" : "bg-transparent"].join(" ")} />
      </span>
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
