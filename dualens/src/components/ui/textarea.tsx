import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={[
        "min-h-32 w-full rounded-[20px] border border-app-line bg-app-card/98 px-4 py-3 text-sm text-app-foreground shadow-none outline-none transition placeholder:text-app-muted/60 focus:border-app-strong/30 focus:ring-2 focus:ring-app-focus/15",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
