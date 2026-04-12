import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="relative z-10 flex flex-col gap-4 border-b border-app-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-app-strong lg:text-[2.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-app-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
