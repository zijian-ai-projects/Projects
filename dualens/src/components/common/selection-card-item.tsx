import type {
  KeyboardEventHandler,
  ReactNode,
  RefCallback
} from "react";
import { useId } from "react";

export function SelectionCardItem({
  name,
  configured,
  statusLabel,
  active,
  icon,
  tabIndex,
  onClick,
  onKeyDown,
  buttonRef
}: {
  name: string;
  configured: boolean;
  statusLabel: string;
  active: boolean;
  icon: ReactNode;
  tabIndex: number;
  onClick(): void;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  buttonRef?: RefCallback<HTMLButtonElement>;
}) {
  const nameId = useId();

  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={active}
      aria-labelledby={nameId}
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
          <span id={nameId} className="block text-sm font-medium text-black">{name}</span>
          <span
            className={[
              "mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-xs",
              configured
                ? "bg-black font-medium text-white"
                : "bg-black/[0.04] text-black/48"
            ].join(" ")}
          >
            {statusLabel}
          </span>
        </span>
      </span>
    </button>
  );
}
