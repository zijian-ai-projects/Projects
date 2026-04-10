import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={[
        "w-full rounded-[20px] border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-none outline-none transition placeholder:text-black/35 focus:border-black/20 focus:ring-2 focus:ring-black/5",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
