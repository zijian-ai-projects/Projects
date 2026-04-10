import type { ReactNode } from "react";

export function SettingRow({
  label,
  hint,
  control
}: {
  label: string;
  hint?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-black/8 py-4 first:border-t-0 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-app-strong">{label}</p>
        {hint ? <p className="max-w-2xl text-sm leading-6 text-app-muted">{hint}</p> : null}
      </div>
      <div className="w-full max-w-md">{control}</div>
    </div>
  );
}
