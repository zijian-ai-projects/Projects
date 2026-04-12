import { Children, type ReactNode } from "react";

export function SectionCard({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasChildren = Children.count(children) > 0;

  return (
    <section
      className={[
        "rounded-[28px] border border-app-line bg-app-card p-6 shadow-app-soft",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
          hasChildren ? "mb-5" : ""
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-app-strong">{title}</h2>
          {description ? <p className="text-sm leading-6 text-app-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
