import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={[
        "w-full rounded-[20px] border border-app-line bg-app-card px-4 py-3 text-sm text-app-foreground shadow-none outline-none transition focus:border-app-strong/30 focus:ring-2 focus:ring-app-focus/15",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}
