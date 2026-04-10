import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={[
        "w-full rounded-[20px] border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-none outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5",
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
