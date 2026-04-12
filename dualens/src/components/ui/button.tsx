import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-app-strong bg-app-strong text-app-inverse hover:bg-app-foreground",
  secondary:
    "border border-app-line bg-app-card text-app-strong hover:bg-app-soft",
  ghost: "bg-transparent text-app-muted hover:bg-app-soft hover:text-app-strong"
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-[8px] px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
