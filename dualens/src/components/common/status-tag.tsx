import type { ReactNode } from "react";

const toneClasses = {
  neutral: "border-black/10 bg-black/[0.03] text-black/66",
  success: "border-black bg-black text-white",
  warning: "border-black/12 bg-white text-black",
  danger: "border-black bg-white text-black"
} as const;

export function StatusTag({
  tone,
  children
}: {
  tone: keyof typeof toneClasses;
  children: ReactNode;
}) {
  return (
    <span
      data-tone={tone}
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
        toneClasses[tone]
      ].join(" ")}
    >
      {children}
    </span>
  );
}
