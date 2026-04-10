import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={[
        "min-h-32 w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-accent focus:ring-2 focus:ring-accent/15",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
