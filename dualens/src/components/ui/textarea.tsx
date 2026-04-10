import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={[
        "min-h-32 w-full rounded-[20px] border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-none outline-none transition placeholder:text-black/35 focus:border-black/20 focus:ring-2 focus:ring-black/5",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
